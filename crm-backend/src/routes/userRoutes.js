const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserLoginSessions // Add getUserLoginSessions here
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), createUser);
router.get('/', protect, authorize('admin'), getUsers);

// User specific sessions route - place before /:id to avoid 'sessions' being treated as an ID
router.get('/:id/sessions', protect, authorize('admin'), getUserLoginSessions); // Add this line

router.get('/:id', protect, getUserById); // Auth logic in controller
router.put('/:id', protect, updateUser);   // Auth logic in controller
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
