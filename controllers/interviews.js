const Interview = require("../models/Interview");
const Company = require("../models/Company");

//@desc     Get all interviews
//@route    GET /api/v1/interviews
//@route    GET /api/v1/companies/:companyId/interviews
//@access   Private
exports.getInterviews = async (req, res, next) => {
  try {
    let query;

    // General users can see only their interviews!
    if (req.user.role !== "admin") {
      // If companyId is provided, filter by both user and company
      if (req.params.companyId) {
        query = Interview.find({
          user: req.user.id,
          company: req.params.companyId,
        }).populate({
          path: "company",
          select: "name address tel",
        });
      } else {
        query = Interview.find({ user: req.user.id }).populate({
          path: "company",
          select: "name address tel",
        });
      }
    } else {
      // If you are an admin, you can see all
      if (req.params.companyId) {
        query = Interview.find({ company: req.params.companyId }).populate({
          path: "company",
          select: "name address tel",
        });
      } else {
        query = Interview.find().populate({
          path: "company",
          select: "name address tel",
        });
      }
    }

    const interviews = await query;

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Interview" });
  }
};

//@desc     Get single interview
//@route    GET /api/v1/interviews/:id
//@access   Private
exports.getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id).populate({
      path: "company",
      select: "name description tel",
    });

    if (!interview) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No interview with the id of ${req.params.id}`,
        });
    }

    // Make sure user is the interview owner
    if (
      interview.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message: `User ${req.user.id} is not authorized to view this interview`,
        });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Interview" });
  }
};

//@desc     Add interview
//@route    POST /api/v1/companies/:companyId/interviews
//@access   Private (User Only)
exports.addInterview = async (req, res, next) => {
  try {
    req.body.company = req.params.companyId;
    req.body.user = req.user.id;
    if (!req.body.bookingLimit) req.body.bookingLimit = 3;

    // --- NEW DATE VALIDATION LOGIC ---
    // 1. Check if the user provided a date
    if (!req.body.date) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide an interview date" });
    }

    // 2. Check if the date is in the future
    const requestedDate = new Date(req.body.date);
    const currentDate = new Date(req.body.dateValidation);

    const startDate = new Date("2022-05-10T00:00:00.000Z");
    const endDate = new Date("2022-05-13T23:59:59.999Z");

    if (requestedDate < startDate || requestedDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Interview date must be between May 10, 2022 and May 13, 2022",
      });
    }

    if (requestedDate >= currentDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Interview date must be in the future",
        });
    }
    // ---------------------------------

    // Check if the company exists
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No company with the id of ${req.params.companyId}`,
        });
    }

    // Check for existed interview (limit to 3 for normal users)
    const existedInterviews = await Interview.find({ user: req.user.id });
    if (existedInterviews.length >= 3 && req.user.role !== "admin") {
      return res
        .status(400)
        .json({
          success: false,
          message: `The user with ID ${req.user.id} has already scheduled 3 interviews`,
        });
    }

    const interview = await Interview.create(req.body);

    res.status(201).json({ success: true, data: interview });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot create Interview" });
  }
};

//@desc     Update interview
//@route    PUT /api/v1/interviews/:id
//@access   Private
exports.updateInterview = async (req, res, next) => {
  try {
    let interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No interview with the id of ${req.params.id}`,
        });
    }

    // Make sure user is the interview owner
    if (
      interview.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message: `User ${req.user.id} is not authorized to update this interview`,
        });
    }

    interview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot update Interview" });
  }
};

//@desc     Delete interview
//@route    DELETE /api/v1/interviews/:id
//@access   Private
exports.deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No interview with the id of ${req.params.id}`,
        });
    }

    // Make sure user is the interview owner
    if (
      interview.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message: `User ${req.user.id} is not authorized to delete this interview`,
        });
    }

    await interview.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete Interview" });
  }
};
