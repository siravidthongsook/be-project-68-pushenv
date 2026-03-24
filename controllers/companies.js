const Company = require("../models/Company");
const Interview = require("../models/Interview");
const createError = require('../utils/createError');

//@desc     Get all companies
//@route    GET /api/v1/companies
//@access   Public
exports.getCompanies = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ["select", "sort", "page", "limit"];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`,
    );

    // Finding resource
    query = Company.find(JSON.parse(queryStr)).populate("interview"); // Ensure virtuals are populated

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const company = await query;

    res
      .status(200)
      .json({ success: true, count: company.length, data: company });
  } catch (err) {
    next(err);
  }
};

//@desc     Get single company
//@route    GET /api/v1/companies/:id
//@access   Public
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate("interview");
    if (!company) {
      return next(createError('ไม่พบบริษัท', 404));
    }
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};
//@desc    Create new company
//@route   POST /api/v1/companies
//@access  Private
exports.createCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (err) {
    next(err);
  }
};

//@desc    Update company
//@route   PUT /api/v1/companies/:id
//@access  Private
exports.updateCompany = async (req, res, next) => {
  try {
    // Fixed: Changed findById to findByIdAndUpdate
    let company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return next(createError('ไม่พบบริษัท', 404));
    }

    // Fixed: Changed 'hospital' to 'company'
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

//@desc     Delete company
//@route    DELETE /api/v1/companies/:id
//@access   Private
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return next(createError('ไม่พบบริษัท', 404));
    }

    await Interview.deleteMany({ company: req.params.id });
    await Company.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
