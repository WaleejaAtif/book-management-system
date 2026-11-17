const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("User", userSchema);