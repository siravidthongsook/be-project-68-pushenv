const express = require('express');
const { deleteUser, getUsers, updateUser } = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), getUsers);

router.route('/:id')
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
