const Task = require('../models/Task');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendTaskCreatedEmail, sendTaskCompletedEmail } = require('../utils/emailService');
const { getWeatherByCity } = require('../utils/weatherService');

/**
 * @desc    Get logged-in user tasks with filtering & pagination
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Filter tasks so users only access their own data
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const skip = (numericPage - 1) * numericLimit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(query).sort(sort).skip(skip).limit(numericLimit),
      Task.countDocuments(query),
    ]);

    res.json({
      data: tasks,
      meta: {
        total,
        page: numericPage,
        limit: numericLimit,
        lastPage: Math.ceil(total / numericLimit),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Fetch weather data if task has a location
    let weather = null;
    if (task.location) {
      weather = await getWeatherByCity(task.location);
    }

    res.json({ task, weather });
  } catch (error) {
    console.error('Get task error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, location } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    let fileUrl = null;

    // Handle file upload to Cloudinary
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        fileUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError.message);
        return res.status(400).json({
          message: 'File upload failed. Please try again.',
        });
      }
    }

    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      description: description?.trim(),
      status: status || 'PENDING',
      priority: priority || 'MEDIUM',
      dueDate: dueDate || undefined,
      location: location?.trim(),
      fileUrl,
    });

    // Fetch weather data for location
    let weather = null;
    if (task.location) {
      weather = await getWeatherByCity(task.location);
    }

    // Send confirmation email (non-blocking)
    sendTaskCreatedEmail(req.user.email, req.user.name, task).catch((err) =>
      console.error('Email send error:', err.message)
    );

    res.status(201).json({ task, weather });
  } catch (error) {
    console.error('Create task error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, status, priority, dueDate, location } = req.body;

    // Track if status is changing to DONE
    const wasNotDone = task.status !== 'DONE';
    const isBecomingDone = status === 'DONE';

    // Handle file upload if new file provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        task.fileUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError.message);
        return res.status(400).json({
          message: 'File upload failed. Please try again.',
        });
      }
    }

    // Update fields
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;
    if (location !== undefined) task.location = location?.trim();

    const updatedTask = await task.save();

    // Fetch weather data
    let weather = null;
    if (updatedTask.location) {
      weather = await getWeatherByCity(updatedTask.location);
    }

    // Send completion email if task just became DONE
    if (wasNotDone && isBecomingDone) {
      sendTaskCompletedEmail(req.user.email, req.user.name, updatedTask).catch((err) =>
        console.error('Email send error:', err.message)
      );
    }

    res.json({ task: updatedTask, weather });
  } catch (error) {
    console.error('Update task error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get weather for a city
 * @route   GET /api/tasks/weather/:city
 * @access  Private
 */
const getWeather = async (req, res) => {
  try {
    const { city } = req.params;
    if (!city) {
      return res.status(400).json({ message: 'City name is required' });
    }

    const weather = await getWeatherByCity(city);

    if (!weather) {
      return res.status(404).json({
        message: `Weather data not available for "${city}"`,
      });
    }

    res.json({ weather });
  } catch (error) {
    console.error('Get weather error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getWeather,
};
