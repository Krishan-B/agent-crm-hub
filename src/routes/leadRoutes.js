const express = require('express');
const router = express.Router();
const {
    createLead,
    getLeads,
    getLeadById // Add getLeadById
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createLead);
router.get('/', protect, getLeads); // Access control in controller
router.get('/:id', protect, getLeadById); // Add this line, access control in controller

module.exports = router;
