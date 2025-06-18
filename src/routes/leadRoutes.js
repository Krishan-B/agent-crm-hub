const express = require('express');
const router = express.Router();
const {
    createLead,
    getLeads,
    getLeadById
} = require('../controllers/leadController');
const {
    uploadKycDocument,
    kycUploadMiddleware,
    getKycStatusAndDocuments // Import this
} = require('../controllers/kycController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Lead main routes
router.post('/', protect, createLead);
router.get('/', protect, getLeads);
router.get('/:id', protect, getLeadById);

// KYC Document routes nested under a specific lead
router.post(
    '/:leadId/kyc/documents',
    protect,
    kycUploadMiddleware,
    uploadKycDocument
);

router.get(
    '/:leadId/kyc',
    protect,
    getKycStatusAndDocuments // Add this route
);

module.exports = router;
