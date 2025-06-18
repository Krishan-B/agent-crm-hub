const express = require('express');
const router = express.Router();
const { downloadKycDocument } = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddleware');

// Download a specific KYC document by its ID
router.get('/documents/:documentId', protect, downloadKycDocument);

module.exports = router;
