const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getWeather,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { handleUpload } = require('../middleware/uploadMiddleware');

// All task routes are protected
router.use(protect);

// Weather route (must be before /:id to avoid conflict)
router.get('/weather/:city', getWeather);

// Task CRUD routes
router.route('/')
  .get(getTasks)
  .post(handleUpload, createTask);

router.route('/:id')
  .get(getTaskById)
  .put(handleUpload, updateTask)
  .delete(deleteTask);

module.exports = router;
