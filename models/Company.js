const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    unique: true,
    trim: true,
    maxlength: [50, "Name can not be more than 50 characters"],
  },
  address: {
    type: String,
    required: [true, "Please add an address"],
  },
  website: {
    type: String,
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
    maxlength: [500, "Description can not be more than 500 characters"],
  },
  tel: {
    type: String,
    required: [true, "Please add a telephone number"],
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
