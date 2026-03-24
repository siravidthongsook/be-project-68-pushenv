const createError = require('../utils/createError');

const FIELD_LABELS = {
  name: 'ชื่อ',
  telephone: 'เบอร์โทรศัพท์',
  email: 'อีเมล',
  password: 'รหัสผ่าน',
  address: 'ที่อยู่',
  description: 'รายละเอียด',
  tel: 'เบอร์โทรศัพท์ติดต่อ',
  role: 'สิทธิ์ผู้ใช้',
};

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log to console for developer
  console.log(err.stack);

  // Mongoose bad ObjectId (e.g., trying to find a hospital with an invalid ID format)
  if (err.name === 'CastError') {
    error = createError('ไม่พบข้อมูลที่ต้องการ', 404);
  }

  // Mongoose duplicate key (e.g., registering with an email that already exists)
  if (err.code === 11000) {
    const duplicatedFields = Object.keys(err.keyValue ?? {});
    const fieldList = duplicatedFields.length > 0
      ? duplicatedFields.map((field) => FIELD_LABELS[field] ?? field).join(', ')
      : 'ข้อมูลนี้';
    error = createError(`${fieldList}ถูกใช้งานแล้ว`, 400);
  }

  // Mongoose validation error (e.g., missing a required field)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((value) => value.message)
      .join(', ');
    error = createError(message || 'ข้อมูลที่ส่งมาไม่ถูกต้อง', 400);
  }

  const details =
    error.details && typeof error.details === 'object' && !Array.isArray(error.details)
      ? error.details
      : {};

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์',
    ...details,
  });
};

module.exports = errorHandler;
