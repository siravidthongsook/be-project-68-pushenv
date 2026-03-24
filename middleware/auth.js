const jwt = require("jsonwebtoken");
const User = require("../models/User");
const createError = require('../utils/createError');

//Protect routes
exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(createError('คุณไม่มีสิทธิ์เข้าถึงเส้นทางนี้', 401));
  }

  try {
    //Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(createError('ไม่พบบัญชีผู้ใช้สำหรับโทเคนนี้', 401));
    }

    next();
  } catch (err) {
    return next(createError('คุณไม่มีสิทธิ์เข้าถึงเส้นทางนี้', 401));
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(`สิทธิ์ ${req.user.role} ไม่มีสิทธิ์เข้าถึงเส้นทางนี้`, 403),
      );
    }
    next();
  };
};
