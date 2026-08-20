const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_BASE = 'http://127.0.0.1:5000/api';
const FRONTEND_BASE = 'http://127.0.0.1:5173';

async function runLiveE2ETest() {
  console.log('====================================================');
  console.log('   LIVE RUNNING APP SMOKE & INTEGRATION TEST        ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Check Frontend Dev Server HTTP status
    console.log('--- 1. Frontend Server Connectivity ---');
    const frontendRes = await axios.get(FRONTEND_BASE);
    assert(frontendRes.status === 200, 'Frontend server responds with HTTP 200 OK');
    assert(frontendRes.data.includes('TaskFlow') || frontendRes.data.includes('<div id="root">'), 'Frontend HTML serves React root container');

    // 2. Check Backend Health Endpoint
    console.log('\n--- 2. Backend Health & API Communication ---');
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.status === 200 && healthRes.data.status === 'ok', 'Backend health check /api/health responds with status ok');

    // 3. Register a New User
    console.log('\n--- 3. User Registration Flow ---');
    const testEmail = `e2e_user_${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'E2E Tester',
      email: testEmail,
      password: 'SecurePassword123!',
    });
    assert(regRes.status === 201, 'User registered successfully with HTTP 201');
    assert(regRes.data.token, 'Registration returns valid JWT bearer token');
    const token = regRes.data.token;

    // 4. User Login Flow
    console.log('\n--- 4. User Login Flow ---');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'SecurePassword123!',
    });
    assert(loginRes.status === 200, 'User logged in successfully with HTTP 200');
    assert(loginRes.data.token, 'Login returns JWT bearer token');
    assert(loginRes.data.user.email === testEmail, 'User profile matches registered email');

    // 5. Open Dashboard / Protected Profile Access
    console.log('\n--- 5. Protected Route Authorization ---');
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(meRes.status === 200 && meRes.data.user.name === 'E2E Tester', 'Accessing /api/auth/me succeeds with Bearer token');

    // 6. Create Task with Location
    console.log('\n--- 6. Task Creation Flow (Location & Fields) ---');
    const task1Res = await axios.post(
      `${API_BASE}/tasks`,
      {
        title: 'Complete Mobile-First Deployment',
        description: 'Verify deployment on Vercel and Render with live integrations.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: '2026-08-25',
        location: 'San Francisco',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    assert(task1Res.status === 201, 'Task 1 created successfully with HTTP 201');
    assert(task1Res.data.task.title === 'Complete Mobile-First Deployment', 'Task 1 title saved accurately');
    assert(task1Res.data.task.location === 'San Francisco', 'Task 1 location stored');
    const task1Id = task1Res.data.task._id;

    // 7. Verify Weather Integration
    console.log('\n--- 7. Weather API Integration ---');
    const weatherRes = await axios.get(`${API_BASE}/tasks/weather/San%20Francisco`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(weatherRes.status === 200 && weatherRes.data.weather, 'Weather endpoint returns weather object for San Francisco');
    assert(weatherRes.data.weather.temp !== undefined, `Weather temperature returned (${weatherRes.data.weather.temp}°C)`);
    assert(weatherRes.data.weather.description, `Weather condition description returned (${weatherRes.data.weather.description})`);

    // 8. Create Task 2 with File Attachment Upload
    console.log('\n--- 8. Task Creation with File Attachment Upload ---');
    const form = new FormData();
    form.append('title', 'Architecture Documentation');
    form.append('description', 'Upload system schema diagram attachment.');
    form.append('status', 'PENDING');
    form.append('priority', 'LOW');
    form.append('location', 'London');
    form.append('file', Buffer.from('Mock PDF Content for attachment testing', 'utf-8'), {
      filename: 'architecture_diagram.pdf',
      contentType: 'application/pdf',
    });

    const task2Res = await axios.post(`${API_BASE}/tasks`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
    });
    assert(task2Res.status === 201, 'Task 2 with file attachment created successfully');
    assert(task2Res.data.task.fileUrl, 'Task 2 fileUrl is attached and accessible');
    const task2Id = task2Res.data.task._id;

    // 9. Edit Task Flow
    console.log('\n--- 9. Task Edit Flow ---');
    const updateRes = await axios.put(
      `${API_BASE}/tasks/${task2Id}`,
      {
        title: 'Architecture Documentation (Final Revision)',
        priority: 'MEDIUM',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    assert(updateRes.status === 200, 'Task updated with HTTP 200');
    assert(updateRes.data.task.title === 'Architecture Documentation (Final Revision)', 'Task title updated');
    assert(updateRes.data.task.priority === 'MEDIUM', 'Task priority updated');

    // 10. Change Task Status to DONE
    console.log('\n--- 10. Quick Status Change (to DONE) ---');
    const statusRes = await axios.put(
      `${API_BASE}/tasks/${task1Id}`,
      { status: 'DONE' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    assert(statusRes.status === 200 && statusRes.data.task.status === 'DONE', 'Task 1 status transitioned to DONE');

    // 11. Test Search
    console.log('\n--- 11. Search Functionality ---');
    const searchRes = await axios.get(`${API_BASE}/tasks?search=Deployment`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(searchRes.data.data.length === 1 && searchRes.data.data[0]._id === task1Id, 'Search matches "Deployment" correctly');

    // 12. Test Filter by Status
    console.log('\n--- 12. Filtering Functionality ---');
    const filterStatusRes = await axios.get(`${API_BASE}/tasks?status=DONE`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(filterStatusRes.data.data.length === 1 && filterStatusRes.data.data[0].status === 'DONE', 'Filter by status=DONE returns only completed tasks');

    // 13. Test Filter by Priority
    const filterPriorityRes = await axios.get(`${API_BASE}/tasks?priority=MEDIUM`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(filterPriorityRes.data.data.length === 1 && filterPriorityRes.data.data[0]._id === task2Id, 'Filter by priority=MEDIUM returns only medium priority tasks');

    // 14. Delete Task Flow
    console.log('\n--- 14. Task Deletion Flow ---');
    const deleteRes = await axios.delete(`${API_BASE}/tasks/${task2Id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(deleteRes.status === 200, 'Task 2 deleted successfully with HTTP 200');

    // Verify Task 2 is gone
    try {
      await axios.get(`${API_BASE}/tasks/${task2Id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert(false, 'Deleted task should not be retrieved');
    } catch (err) {
      assert(err.response?.status === 404, 'Accessing deleted task returns HTTP 404 Not Found');
    }

    // 15. Protected Route Access Rejection Without / Corrupted Token
    console.log('\n--- 15. Protected Route Guard (Post-Logout Simulation) ---');
    try {
      await axios.get(`${API_BASE}/tasks`, {
        headers: { Authorization: 'Bearer invalid_or_expired_token' },
      });
      assert(false, 'Invalid token should be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthorized request returns HTTP 401');
    }

    try {
      await axios.get(`${API_BASE}/tasks`);
      assert(false, 'Missing token should be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Missing token returns HTTP 401');
    }

    // 16. Verify Responsive CSS Breakpoints & Tokens in Index.css
    console.log('\n--- 16. CSS & Responsive Breakpoint Verification ---');
    const cssContent = fs.readFileSync('../frontend/src/index.css', 'utf-8');
    assert(cssContent.includes('@media (max-width: 640px)'), 'CSS contains Mobile (<640px) responsive queries');
    assert(cssContent.includes('@media (min-width: 641px) and (max-width: 1024px)') || cssContent.includes('@media (max-width: 768px)'), 'CSS contains Tablet responsive queries');
    assert(cssContent.includes('navbar-toggle'), 'CSS contains Mobile hamburger navbar styles');
    assert(cssContent.includes('weather-badge'), 'CSS contains Weather badge styling');

    console.log('\n====================================================');
    console.log(`LIVE E2E SMOKE TEST RESULT: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('E2E Test Execution Error:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    process.exit(1);
  }
}

runLiveE2ETest();
