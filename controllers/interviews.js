const Interview = require("../models/Interview");
const Company = require("../models/Company");
const User = require("../models/User");

const INTERVIEW_START_DATE = new Date("2022-05-10T00:00:00.000Z");
const INTERVIEW_END_DATE = new Date("2022-05-13T23:59:59.999Z");
const INTERVIEW_SLOT_HOUR_UTC = 10;

function buildInterviewSlots() {
  const slots = [];
  const cursor = new Date(INTERVIEW_START_DATE);

  while (cursor <= INTERVIEW_END_DATE) {
    slots.push(
      new Date(
        Date.UTC(
          cursor.getUTCFullYear(),
          cursor.getUTCMonth(),
          cursor.getUTCDate(),
          INTERVIEW_SLOT_HOUR_UTC,
          0,
          0,
          0,
        ),
      ),
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots;
}

const INTERVIEW_SLOTS = buildInterviewSlots();

function serializeInterviewSlots() {
  return INTERVIEW_SLOTS.map((slot) => ({
    value: slot.toISOString(),
    label: slot.toLocaleDateString("th-TH", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  }));
}

function isAllowedInterviewDate(value) {
  const requestedDate = new Date(value);

  if (Number.isNaN(requestedDate.getTime())) {
    return false;
  }

  return INTERVIEW_SLOTS.some(
    (slot) => slot.toISOString() === requestedDate.toISOString(),
  );
}

async function resolveBookingUserId(req) {
  if (req.user.role !== "admin") {
    return req.user.id;
  }

  const targetUserId = req.body.userId || req.body.user;

  if (!targetUserId) {
    return null;
  }

  const targetUser = await User.findById(targetUserId).select("_id");

  if (!targetUser) {
    return undefined;
  }

  return targetUser.id;
}

//@desc     Get available interview slots
//@route    GET /api/v1/interviews/slots
//@access   Private
exports.getInterviewSlots = async (req, res, next) => {
  res.status(200).json({
    success: true,
    count: INTERVIEW_SLOTS.length,
    data: serializeInterviewSlots(),
  });
};

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
        })
          .populate({
            path: "company",
            select: "name address tel",
          })
          .populate({
            path: "user",
            select: "name telephone email role createdAt",
          });
      } else {
        query = Interview.find({ user: req.user.id })
          .populate({
            path: "company",
            select: "name address tel",
          })
          .populate({
            path: "user",
            select: "name telephone email role createdAt",
          });
      }
    } else {
      // If you are an admin, you can see all
      if (req.params.companyId) {
        query = Interview.find({ company: req.params.companyId })
          .populate({
            path: "company",
            select: "name address tel",
          })
          .populate({
            path: "user",
            select: "name telephone email role createdAt",
          });
      } else {
        query = Interview.find()
          .populate({
            path: "company",
            select: "name address tel",
          })
          .populate({
            path: "user",
            select: "name telephone email role createdAt",
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

    await interview.populate({
      path: "user",
      select: "name telephone email role createdAt",
    });

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

    const targetUserId = await resolveBookingUserId(req);

    if (targetUserId === null) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a userId" });
    }

    if (targetUserId === undefined) {
      return res
        .status(404)
        .json({ success: false, message: "No user found for the supplied userId" });
    }

    req.body.user = targetUserId;

    if (!req.body.date) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide an interview date" });
    }

    if (!isAllowedInterviewDate(req.body.date)) {
      return res.status(400).json({
        success: false,
        message: "Please choose one of the available interview slots",
      });
    }

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
    const existedInterviews = await Interview.find({ user: targetUserId });
    if (existedInterviews.length >= 3 && req.user.role !== "admin") {
      return res
        .status(400)
        .json({
          success: false,
          message: `The user with ID ${targetUserId} has already scheduled 3 interviews`,
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

//@desc     Add interviews for multiple companies at once
//@route    POST /api/v1/interviews/bulk
//@access   Private (User Only)
exports.addMultipleInterviews = async (req, res, next) => {
  try {
    if (req.params.companyId) {
      return res.status(400).json({
        success: false,
        message: "Use POST /api/v1/interviews/bulk for multi-company booking",
      });
    }

    const { date, companyIds } = req.body;
    const targetUserId = await resolveBookingUserId(req);

    if (targetUserId === null) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a userId" });
    }

    if (targetUserId === undefined) {
      return res
        .status(404)
        .json({ success: false, message: "No user found for the supplied userId" });
    }

    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide an interview date" });
    }

    if (!isAllowedInterviewDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Please choose one of the available interview slots",
      });
    }

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide companyIds as a non-empty array",
      });
    }

    const uniqueCompanyIds = [...new Set(companyIds)];

    if (uniqueCompanyIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: "You can book at most 3 interviews per request",
      });
    }

    const existingInterviewCount = await Interview.countDocuments({
      user: targetUserId,
    });

    if (
      req.user.role !== "admin" &&
      existingInterviewCount + uniqueCompanyIds.length > 3
    ) {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${targetUserId} can only schedule up to 3 interviews`,
      });
    }

    const companies = await Company.find({ _id: { $in: uniqueCompanyIds } }).select(
      "_id",
    );

    if (companies.length !== uniqueCompanyIds.length) {
      const existingCompanyIds = new Set(companies.map((company) => company._id.toString()));
      const missingCompanyIds = uniqueCompanyIds.filter(
        (companyId) => !existingCompanyIds.has(companyId.toString()),
      );

      return res.status(404).json({
        success: false,
        message: "Some companies were not found",
        missingCompanyIds,
      });
    }

    const payload = uniqueCompanyIds.map((companyId) => ({
      date: new Date(date),
      company: companyId,
      user: targetUserId,
    }));

    const interviews = await Interview.insertMany(payload);

    res.status(201).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot create Interviews" });
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

    if (req.body.date) {
      if (!isAllowedInterviewDate(req.body.date)) {
        return res.status(400).json({
          success: false,
          message: "Please choose one of the available interview slots",
        });
      }
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
