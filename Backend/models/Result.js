const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  userId: String,
  audioUrl: String,
  prediction: String,
  confidence: String,
  modelType: {
    type: String,
    default: "custom",
  },
  modelLabel: {
    type: String,
    default: "Custom model",
  },
  originalFilename: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Result", resultSchema);
