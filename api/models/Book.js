const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "General" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("Book", bookSchema);