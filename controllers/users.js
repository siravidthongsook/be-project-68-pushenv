const User = require('../models/User');
const Interview = require('../models/Interview');

async function buildBookingCountMap(userIds) {
  const counts = await Interview.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', bookingCount: { $sum: 1 } } },
  ]);

  return new Map(
    counts.map((item) => [String(item._id), item.bookingCount]),
  );
}

function serializeUser(user, bookingCount = 0) {
  return {
    ...user.toObject(),
    bookingCount,
  };
}

//@desc     Get all users
//@route    GET /api/v1/users
//@access   Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name telephone email role createdAt')
      .sort('-createdAt');

    const bookingCounts = await buildBookingCountMap(
      users.map((user) => user._id),
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map((user) =>
        serializeUser(user, bookingCounts.get(String(user._id)) ?? 0),
      ),
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
  }
};

//@desc     Update user role
//@route    PUT /api/v1/users/:id
//@access   Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุสิทธิ์ผู้ใช้ที่ถูกต้อง',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      {
        new: true,
        runValidators: true,
      },
    ).select('name telephone email role createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบบัญชีผู้ใช้ที่มีรหัส ${req.params.id}`,
      });
    }

    const bookingCount = await Interview.countDocuments({ user: user._id });

    res.status(200).json({
      success: true,
      data: serializeUser(user, bookingCount),
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้' });
  }
};

//@desc     Delete user
//@route    DELETE /api/v1/users/:id
//@access   Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'คุณไม่สามารถลบบัญชีแอดมินของตัวเองได้',
      });
    }

    const user = await User.findById(req.params.id).select('_id');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบบัญชีผู้ใช้ที่มีรหัส ${req.params.id}`,
      });
    }

    await Interview.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'ไม่สามารถลบผู้ใช้ได้' });
  }
};
