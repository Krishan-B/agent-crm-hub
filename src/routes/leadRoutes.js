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
    getKycStatusAndDocuments
} = require('../controllers/kycController');
const {
    getCurrentBalance,
    addBalanceOrBonus,
    getTransactionHistory // Add getTransactionHistory
} = require('../controllers/balanceController');
const { protect } = require('../middleware/authMiddleware');

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
    getKycStatusAndDocuments
);

// Balance routes nested under a specific lead
router.get(
    '/:leadId/balance',
    protect,
    getCurrentBalance
);
router.post(
    '/:leadId/balance',
    protect,
    addBalanceOrBonus
);
router.get( // Add this route for getting transaction history
    '/:leadId/transactions',
    protect,
    getTransactionHistory
);

module.exports = router;
