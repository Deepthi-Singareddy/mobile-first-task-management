const mongoose = require('mongoose');

let dbDiagnostics = {
  configured: false,
  varName: 'NONE',
  protocol: 'NONE',
  lastError: null,
  connectionAttempts: 0,
};

const sanitizeError = (errMsg) => {
  if (!errMsg) return null;
  return errMsg.replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb$1://[REDACTED]@');
};

const connectDB = async () => {
  const varName = process.env.MONGO_URI ? 'MONGO_URI' : (process.env.MONGODB_URI ? 'MONGODB_URI' : 'NONE');
  const rawUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  dbDiagnostics.connectionAttempts++;
  dbDiagnostics.varName = varName;

  if (!rawUri) {
    dbDiagnostics.configured = false;
    dbDiagnostics.lastError = 'Environment variable MONGO_URI (or MONGODB_URI) is not defined in Render.';
    console.error('Neither MONGO_URI nor MONGODB_URI is defined in environment variables.');
    return;
  }

  const mongoUri = rawUri.trim();
  dbDiagnostics.configured = true;
  dbDiagnostics.protocol = mongoUri.startsWith('mongodb+srv://')
    ? 'mongodb+srv'
    : mongoUri.startsWith('mongodb://')
    ? 'mongodb'
    : 'invalid_protocol';

  // Mongoose connection event listeners
  mongoose.connection.on('connected', () => {
    dbDiagnostics.lastError = null;
    console.log(`MongoDB Connected successfully to host: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    dbDiagnostics.lastError = sanitizeError(err.message);
    console.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    dbDiagnostics.lastError = null;
    console.log(`MongoDB initial connection established to: ${conn.connection.host}`);
  } catch (error) {
    dbDiagnostics.lastError = sanitizeError(error.message);
    console.error(`MongoDB connection failed: ${error.message}`);
  }
};

const getDbDiagnostics = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || null,
    envConfigured: dbDiagnostics.configured,
    detectedVarName: dbDiagnostics.varName,
    protocol: dbDiagnostics.protocol,
    lastError: dbDiagnostics.lastError,
    attempts: dbDiagnostics.connectionAttempts,
  };
};

module.exports = { connectDB, getDbDiagnostics };

