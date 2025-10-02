const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  points: { type: Number, default: 0 },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Badge" }],
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],
});

module.exports = mongoose.model("User", userSchema);
