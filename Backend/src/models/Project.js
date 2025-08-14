

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // optional
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
