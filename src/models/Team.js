const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',required: true },
} , { timestamps: true } );

module.exports = mongoose.model('Team', teamSchema);
