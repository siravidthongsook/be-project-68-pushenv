const User = require('../models/User');
const createError = require('../utils/createError');

const sendTokenResponse = (user,statusCode,res)=>{
    const token = user.getSignedJwtToken()
    
    const option = {
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly:true
    };

    if(process.env.NODE_ENV === 'production'){
        option.secure= true;
    }

    res.status(statusCode).cookie('token',token,option).json({success:true,token});
};

//@desc     Register User
//@route    POST /api/v1/auth/register
//@access   Public
exports.register = async (req,res,next)=>{
    try {
        const {name,telephone,email,password,role} = req.body;
        const user = await User.create({
            name,
            telephone,
            email,
            password,
            role
        });
        sendTokenResponse(user,200,res);
    } catch (error) {
        next(error);
    }
};
//@desc    Login to registerd User
//@route   POST /api/v1/auth/login
//@access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return next(createError('กรุณากรอกอีเมลและรหัสผ่าน', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(createError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 400));
    }
    
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(createError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 400));
    }

    // Password Match Create Token (Removed redundant token generation since sendTokenResponse handles it)
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

//@desc    Get current logged in user
//@route   GET /api/v1/auth/me
//@access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(createError('ไม่พบบัญชีผู้ใช้', 404));
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

//@desc    Log user out / clear cookie
//@route   GET /api/v1/auth/logout
//@access  Private
exports.logout = async (req, res, next) => {
  // Overwrite the existing token cookie with a dummy value and expire it immediately
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};
