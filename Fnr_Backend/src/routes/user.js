const express = require('express');
const router = express.Router();
const { getUsers, updateUser, promoteUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, getUsers);
router.put('/:id', protect, roleCheck('admin'), updateUser);
router.put('/promote/:id', protect, roleCheck('admin'), promoteUser); // Corrected path


module.exports = router;