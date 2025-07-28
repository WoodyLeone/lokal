const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Import routes
const videoRoutes = require('./routes/videos');
const productRoutes = require('./routes/products');

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const openaiStatus = process.env.OPENAI_API_KEY ? 'Available' : 'Not configured';
  
  res.json({ 
    status: 'OK', 
    message: 'Lokal Backend Server is running',
    features: {
      yolo: 'Available',
      openai: openaiStatus,
      hybrid: process.env.OPENAI_API_KEY ? 'Available' : 'YOLO-only'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Lokal Backend Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Network API available at http://192.168.1.207:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
}); 