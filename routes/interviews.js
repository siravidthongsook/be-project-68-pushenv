const express = require('express');

const {
  getInterviews,
  getInterview,
  addInterview,
  addMultipleInterviews,
  updateInterview,
  deleteInterview
} = require('../controllers/interviews');

// Import authentication middleware
const { protect, authorize } = require('../middleware/auth');

// We need to merge params so we can access companyId from the Company router
const router = express.Router({ mergeParams: true });

router.route('/')
  .get(protect, getInterviews)
  .post(protect, authorize('user'), addInterview); // User only

router.route('/bulk')
  .post(protect, authorize('user'), addMultipleInterviews); // User only

router.route('/:id')
  .get(protect, getInterview)
  .put(protect, authorize('admin', 'user'), updateInterview)
  .delete(protect, authorize('admin', 'user'), deleteInterview);

module.exports = router;
