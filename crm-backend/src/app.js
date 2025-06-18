const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic Route
app.get('/', (req, res) => {
  res.send('CRM Backend is running!');
});

// Placeholder for future routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const kycRoutes = require('./routes/kycRoutes'); // Add this line

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes); // Handles /api/leads/:leadId/kyc/...
app.use('/api/kyc', kycRoutes);   // Handles /api/kyc/documents/:documentId

module.exports = app;
