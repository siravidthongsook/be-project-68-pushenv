const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "กรุณากรอกชื่อบริษัท"],
    unique: true,
    trim: true,
    maxlength: [50, "ชื่อบริษัทต้องมีความยาวไม่เกิน 50 ตัวอักษร"],
  },
  address: {
    type: String,
    required: [true, "กรุณากรอกที่อยู่บริษัท"],
  },
  website: {
    type: String,
  },
  description: {
    type: String,
    required: [true, "กรุณากรอกรายละเอียดบริษัท"],
    maxlength: [500, "รายละเอียดบริษัทต้องมีความยาวไม่เกิน 500 ตัวอักษร"],
  },
  tel: {
    type: String,
    required: [true, "กรุณากรอกเบอร์โทรศัพท์ติดต่อ"],
  },
});

// Reverse populate with virtuals
CompanySchema.virtual("interview", {
  ref: "Interview",
  localField: "_id",
  foreignField: "company",
  justOne: false,
});

// Ensure virtuals are included when converting the document to JSON
CompanySchema.set("toJSON", { virtuals: true });
CompanySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Company", CompanySchema);
