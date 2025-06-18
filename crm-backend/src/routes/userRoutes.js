const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsers,
    getUserById
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/users - Create a new user (Admin only)
router.post('/', protect, authorize('admin'), createUser);

// GET /api/users - Get all users (Admin only)
router.get('/', protect, authorize('admin'), getUsers);

// GET /api/users/:id - Get user by ID (Admin can get any, Agent their own)
// Note: The authorize middleware here is more complex due to self-access.
// The controller handles the specific logic for self-access vs admin access.
// So, we just need 'protect' to ensure user is authenticated.
router.get('/:id', protect, getUserById);

module.exports = router;
