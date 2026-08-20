const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'https://mobile-first-task-management-api.onrender.com';

async function runProductionAudit() {
  console.log('===========================================================');
  console.log('   LIVE PRODUCTION API VERIFICATION (RENDER BACKEND)       ');
  console.log('   Target: ' + BASE_URL);
  console.log('===========================================================\n');

  const results = [];

  function record(feature, status, httpCode, evidence) {
    results.push({ feature, status, httpCode, evidence });
    console.log(`[${status}] ${feature} (HTTP ${httpCode}) - ${evidence}`);
  }

  try {
    // 0. Health & DB Status
    const healthRes = await axios.get(`${BASE_URL}/health`, { timeout: 15000 });
    const isDbConnected = healthRes.data.database === 'connected';
    record(
      '0. Health & Database Check',
      isDbConnected ? 'PASS' : 'FAIL',
      healthRes.status,
      `Status: ${healthRes.data.status}, Database: ${healthRes.data.database}, Host: ${healthRes.data.databaseHost || 'N/A'}`
    );

    // 1. User Registration (User A)
    const userA = {
      name: 'Production Alice',
      email: `prod_alice_${Date.now()}@example.com`,
      password: 'ProdSecurePassword123!'
    };
    const regResA = await axios.post(`${BASE_URL}/api/auth/register`, userA, { timeout: 15000 });
    const tokenA = regResA.data.token;
    const userIdA = regResA.data.user?._id;
    record(
      '1. User Registration (User A)',
      regResA.status === 201 && tokenA ? 'PASS' : 'FAIL',
      regResA.status,
      `User created with ID: ${userIdA}, Token issued: ${!!tokenA}`
    );

    // 2. User Registration (User B for Isolation Testing)
    const userB = {
      name: 'Production Bob',
      email: `prod_bob_${Date.now()}@example.com`,
      password: 'ProdSecurePassword456!'
    };
    const regResB = await axios.post(`${BASE_URL}/api/auth/register`, userB, { timeout: 15000 });
    const tokenB = regResB.data.token;
    const userIdB = regResB.data.user?._id;
    record(
      '2. User Registration (User B)',
      regResB.status === 201 && tokenB ? 'PASS' : 'FAIL',
      regResB.status,
      `User created with ID: ${userIdB}`
    );

    // 3. User Login
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: userA.email,
      password: userA.password
    }, { timeout: 15000 });
    record(
      '3. User Login',
      loginRes.status === 200 && loginRes.data.token ? 'PASS' : 'FAIL',
      loginRes.status,
      `Login successful for ${loginRes.data.user?.email}`
    );

    // 4. GET /api/auth/me (Protected Profile)
    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    record(
      '4. Get User Profile (Protected)',
      meRes.status === 200 && meRes.data.user?.name === userA.name ? 'PASS' : 'FAIL',
      meRes.status,
      `Retrieved profile for name: '${meRes.data.user?.name}'`
    );

    // 5. POST /api/tasks (Create Task for User A)
    const taskDataA = {
      title: 'Production Verification Task',
      description: 'Audit live MongoDB Atlas persistence on Render.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-08-28',
      location: 'San Francisco'
    };
    const createTaskResA = await axios.post(`${BASE_URL}/api/tasks`, taskDataA, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    const taskIdA = createTaskResA.data.task?._id;
    record(
      '5. Task Creation (User A)',
      createTaskResA.status === 201 && taskIdA ? 'PASS' : 'FAIL',
      createTaskResA.status,
      `Task created: '${createTaskResA.data.task?.title}', Status: ${createTaskResA.data.task?.status}, ID: ${taskIdA}`
    );

    // 6. POST /api/tasks (Create Task for User B)
    const taskDataB = {
      title: 'Bob Private Financial Audit',
      description: 'Confidential task belonging to User B.',
      status: 'PENDING',
      priority: 'MEDIUM',
      location: 'London'
    };
    const createTaskResB = await axios.post(`${BASE_URL}/api/tasks`, taskDataB, {
      headers: { Authorization: `Bearer ${tokenB}` },
      timeout: 15000
    });
    const taskIdB = createTaskResB.data.task?._id;
    record(
      '6. Task Creation (User B)',
      createTaskResB.status === 201 && taskIdB ? 'PASS' : 'FAIL',
      createTaskResB.status,
      `Task created for User B with ID: ${taskIdB}`
    );

    // 7. GET /api/tasks (List Tasks & Data Isolation)
    const listTasksA = await axios.get(`${BASE_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    const userASeesBob = listTasksA.data.data.some(t => t._id === taskIdB || t.title.includes('Bob Private'));
    const isolationPassed = listTasksA.status === 200 && !userASeesBob && listTasksA.data.data.length >= 1;
    record(
      '7. Task Query & Data Isolation',
      isolationPassed ? 'PASS' : 'FAIL',
      listTasksA.status,
      `Total tasks for User A: ${listTasksA.data.meta?.total}. Cross-user data leakage: ${userASeesBob ? 'DETECTED (FAIL)' : 'NONE (PASS)'}`
    );

    // 8. PUT /api/tasks/:id (Update Task)
    const updateTaskRes = await axios.put(`${BASE_URL}/api/tasks/${taskIdA}`, {
      title: 'Production Verification Task (Completed)',
      status: 'DONE',
      priority: 'HIGH'
    }, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    record(
      '8. Task Update & Status Change',
      updateTaskRes.status === 200 && updateTaskRes.data.task?.status === 'DONE' ? 'PASS' : 'FAIL',
      updateTaskRes.status,
      `Updated title: '${updateTaskRes.data.task?.title}', Status: ${updateTaskRes.data.task?.status}`
    );

    // 9. Search & Filtering
    const searchRes = await axios.get(`${BASE_URL}/api/tasks?search=Verification`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    const filterRes = await axios.get(`${BASE_URL}/api/tasks?status=DONE`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    const searchPassed = searchRes.status === 200 && searchRes.data.data.length > 0;
    const filterPassed = filterRes.status === 200 && filterRes.data.data.every(t => t.status === 'DONE');
    record(
      '9. Search & Filter Querying',
      searchPassed && filterPassed ? 'PASS' : 'FAIL',
      200,
      `Search match count: ${searchRes.data.data.length}, Filter status=DONE count: ${filterRes.data.data.length}`
    );

    // 10. Cross-Tenant Access Rejection (User A trying to access User B task)
    let crossAccessBlocked = false;
    let crossStatusCode = 0;
    try {
      await axios.get(`${BASE_URL}/api/tasks/${taskIdB}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
        timeout: 15000
      });
    } catch (err) {
      crossStatusCode = err.response?.status;
      if (crossStatusCode === 404) crossAccessBlocked = true;
    }
    record(
      '10. Cross-Tenant Access Rejection',
      crossAccessBlocked ? 'PASS' : 'FAIL',
      crossStatusCode,
      `Unauthorized cross-user task access returned HTTP ${crossStatusCode} (Task isolated)`
    );

    // 11. Unauthenticated Request Rejection
    let unauthBlocked = false;
    let unauthStatusCode = 0;
    try {
      await axios.get(`${BASE_URL}/api/tasks`, { timeout: 15000 });
    } catch (err) {
      unauthStatusCode = err.response?.status;
      if (unauthStatusCode === 401) unauthBlocked = true;
    }
    record(
      '11. Protected Route Security (No Token)',
      unauthBlocked ? 'PASS' : 'FAIL',
      unauthStatusCode,
      `Unauthenticated request correctly returned HTTP ${unauthStatusCode} Unauthorized`
    );

    // 12. Weather API Live Endpoint
    const weatherRes = await axios.get(`${BASE_URL}/api/tasks/weather/San%20Francisco`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    record(
      '12. Weather API Integration',
      weatherRes.status === 200 && weatherRes.data.weather ? 'PASS' : 'FAIL',
      weatherRes.status,
      `City: ${weatherRes.data.weather?.cityName}, Temp: ${weatherRes.data.weather?.temp}°C, Condition: ${weatherRes.data.weather?.description}`
    );

    // 13. File Upload (Multipart Form Data)
    const form = new FormData();
    form.append('title', 'Attachment Cloud Storage Task');
    form.append('description', 'Task with binary image upload.');
    form.append('status', 'PENDING');
    form.append('priority', 'LOW');
    form.append('file', Buffer.from('Live test attachment content for assignment verification', 'utf-8'), {
      filename: 'sample_doc.txt',
      contentType: 'text/plain'
    });

    const uploadRes = await axios.post(`${BASE_URL}/api/tasks`, form, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        ...form.getHeaders()
      },
      timeout: 20000
    });
    const uploadedFileUrl = uploadRes.data.task?.fileUrl;
    record(
      '13. File Attachment Upload',
      uploadRes.status === 201 && uploadedFileUrl ? 'PASS' : 'FAIL',
      uploadRes.status,
      `File attached successfully. URL generated: ${uploadedFileUrl ? 'YES' : 'NO'}`
    );

    // 14. DELETE /api/tasks/:id (Delete Task)
    const deleteRes = await axios.delete(`${BASE_URL}/api/tasks/${taskIdA}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      timeout: 15000
    });
    record(
      '14. Task Deletion',
      deleteRes.status === 200 ? 'PASS' : 'FAIL',
      deleteRes.status,
      `Task ${taskIdA} deleted successfully: '${deleteRes.data.message}'`
    );

    console.log('\n===========================================================');
    console.log('ALL PRODUCTION API TESTS COMPLETED');
    console.log('===========================================================');

  } catch (error) {
    console.error('Fatal Production Test Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status, 'Data:', error.response.data);
    }
  }
}

runProductionAudit();
