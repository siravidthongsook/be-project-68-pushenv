const express = require('express');
const { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } = require('../controllers/companies');
const interviewRouter = require('./interviews');

const router = express.Router();

// Import auth middleware
const { protect, authorize } = require('../middleware/auth');

// Re-route into interview router
router.use('/:companyId/interviews', interviewRouter);

// Apply RBAC to routes
router.route('/')
  .get(getCompanies)
  .post(protect, authorize('admin'), createCompany); // Admin only

router.route('/:id')
  .get(getCompany)
  .put(protect, authorize('admin'), updateCompany) // Admin only
  .delete(protect, authorize('admin'), deleteCompany); // Admin only

module.exports = router;