const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  time: {
    type: String
  }

}, { timestamps: true });

module.exports =
  mongoose.models.Message ||
  mongoose.model("Message", messageSchema);