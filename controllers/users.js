const User = require('../models/User');

//@desc     Get all users
//@route    GET /api/v1/users
//@access   Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name telephone email role createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: 'Cannot find Users' });
  }
};
