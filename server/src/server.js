const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/markflow';

// Middleware
app.use(cors());
app.use(express.json());

// High Security Access Token Middleware
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || 'phaniswar883459';
app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  const clientToken = req.headers['x-access-token'];
  if (clientToken !== ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing access token' });
  }
  next();
});

// Routes
const subjectRoutes = require('./routes/subjects');
const feedbackRoutes = require('./routes/feedback');
const aiRoutes = require('./routes/ai');
app.use('/api/subjects', subjectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Database connection & Server launch
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB successfully connected.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Starting server in offline-ready database mode anyway to allow client sync mock...');
    app.listen(PORT, () => {
      console.log(`Server is running in local-only mode on port ${PORT} (Database disconnected)`);
    });
  });
