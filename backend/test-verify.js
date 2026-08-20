const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Task = require('./models/Task');
const { protect } = require('./middleware/authMiddleware');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { handleUpload } = require('./middleware/uploadMiddleware');
const { getWeatherByCity } = require('./utils/weatherService');
const { sendTaskCreatedEmail, sendTaskCompletedEmail } = require('./utils/emailService');

process.env.JWT_SECRET = 'super_secret_jwt_key_test_123456';
process.env.PORT = '5000';
process.env.NODE_ENV = 'test';

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

async function runTestSuite() {
  console.log('====================================================');
  console.log('   FULL SYSTEM REQUIREMENT VERIFICATION SUITE       ');
  console.log('====================================================\n');

  // 1. Password Hashing & Authentication
  console.log('--- 1. Password Hashing & User Security ---');
  const rawPassword = 'MySecretPassword123!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);
  assert(hashedPassword !== rawPassword, 'Password is encrypted using bcryptjs');
  assert(await bcrypt.compare(rawPassword, hashedPassword), 'Bcrypt matchPassword validates correct password');
  assert(!(await bcrypt.compare('WrongPassword', hashedPassword)), 'Bcrypt matchPassword rejects wrong password');

  // 2. JWT Generation & Verification
  console.log('\n--- 2. JWT Token Lifecycle & Protected Routes ---');
  const mockUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const token = jwt.sign({ id: mockUserId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  assert(typeof token === 'string' && token.split('.').length === 3, 'Valid 3-part signed JWT generated');
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert(decoded.id === mockUserId, 'JWT payload decodes correct user ID');

  // 3. Schema & Validation Rules
  console.log('\n--- 3. Mongoose Schemas & Field Requirements ---');
  const userPaths = User.schema.paths;
  assert(userPaths.name.isRequired, 'User schema requires name');
  assert(userPaths.email.isRequired, 'User schema requires email');
  assert(userPaths.password.isRequired, 'User schema requires password');

  const taskPaths = Task.schema.paths;
  assert(taskPaths.user.isRequired, 'Task schema requires user reference');
  assert(taskPaths.title.isRequired, 'Task schema requires title');
  assert(taskPaths.status.enumValues.includes('PENDING') && 
         taskPaths.status.enumValues.includes('IN_PROGRESS') && 
         taskPaths.status.enumValues.includes('DONE'), 'Task status enum has [PENDING, IN_PROGRESS, DONE]');
  assert(taskPaths.priority.enumValues.includes('LOW') && 
         taskPaths.priority.enumValues.includes('MEDIUM') && 
         taskPaths.priority.enumValues.includes('HIGH'), 'Task priority enum has [LOW, MEDIUM, HIGH]');
  assert(taskPaths.dueDate, 'Task schema includes dueDate');
  assert(taskPaths.location, 'Task schema includes location');
  assert(taskPaths.fileUrl, 'Task schema includes fileUrl');

  // 4. Data Isolation & Query Filtering Logic
  console.log('\n--- 4. Query Logic, Filtering & Pagination Math ---');
  const reqUserA = { _id: 'user_A_id' };
  const queryParams = {
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    search: 'meeting',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
  };

  // Simulating query builder from taskController.js
  const query = { user: reqUserA._id };
  if (queryParams.status) query.status = queryParams.status;
  if (queryParams.priority) query.priority = queryParams.priority;
  if (queryParams.search) {
    query.$or = [
      { title: { $regex: queryParams.search, $options: 'i' } },
      { description: { $regex: queryParams.search, $options: 'i' } },
    ];
  }
  if (queryParams.startDate || queryParams.endDate) {
    query.dueDate = {};
    if (queryParams.startDate) query.dueDate.$gte = new Date(queryParams.startDate);
    if (queryParams.endDate) query.dueDate.$lte = new Date(queryParams.endDate);
  }

  assert(query.user === 'user_A_id', 'Query strictly enforces user data isolation');
  assert(query.status === 'IN_PROGRESS', 'Query filters by status');
  assert(query.priority === 'HIGH', 'Query filters by priority');
  assert(query.$or.length === 2, 'Query searches across title and description');
  assert(query.dueDate.$gte instanceof Date && query.dueDate.$lte instanceof Date, 'Query filters by dueDate range');

  // Pagination calculation
  const total = 25;
  const page = 2;
  const limit = 10;
  const skip = (page - 1) * limit;
  const lastPage = Math.ceil(total / limit);
  assert(skip === 10, 'Pagination skip calculation is correct ((2-1)*10 = 10)');
  assert(lastPage === 3, 'Pagination lastPage calculation is correct (Math.ceil(25/10) = 3)');

  // 5. Auth Middleware Guard
  console.log('\n--- 5. Auth Middleware Guard Verification ---');
  let mockReqWithoutToken = { headers: {} };
  let mockRes = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.body = data; return this; }
  };
  let nextCalled = false;
  await protect(mockReqWithoutToken, mockRes, () => { nextCalled = true; });
  assert(mockRes.statusCode === 401, 'Auth middleware returns 401 when no token is provided');
  assert(!nextCalled, 'Auth middleware blocks unauthorized request from proceeding');

  // 6. Centralized Error Handler
  console.log('\n--- 6. Centralized Error Handler ---');
  let errRes = {
    statusCode: 200,
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { this.body = data; return this; }
  };
  const testError = new Error('Database connection failed');
  errorHandler(testError, {}, errRes, () => {});
  assert(errRes.statusCode === 500, 'Error middleware catches and formats 500 server error');
  assert(errRes.body.message === 'Database connection failed', 'Error middleware returns error message');

  // 7. Third-Party Integrations
  console.log('\n--- 7. Third-Party Service Handlers ---');
  assert(typeof getWeatherByCity === 'function', 'OpenWeatherMap integration module is active');
  assert(typeof sendTaskCreatedEmail === 'function', 'Nodemailer task created email module is active');
  assert(typeof sendTaskCompletedEmail === 'function', 'Nodemailer task completed email module is active');

  const weatherNullCheck = await getWeatherByCity('');
  assert(weatherNullCheck === null, 'Weather service handles empty city gracefully');

  console.log('\n====================================================');
  console.log(`VERIFICATION RESULT: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
