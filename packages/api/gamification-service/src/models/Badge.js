const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
  name: String,
  description: String,
  points: Number,
});

module.exports = mongoose.model("Badge", badgeSchema);
