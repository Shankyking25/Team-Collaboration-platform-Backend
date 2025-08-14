const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');
const teamValidation = require('../../validations/teamValidation');

// ----------------------
// CREATE NEW TEAM
// ----------------------
router.post('/', authenticate, async (req, res) => {
  // Only ADMIN can create a team
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: "Only admins can create a team" });
  }

  // Check if user already belongs to a team
  if (req.user.teamId) {
    return res.status(400).json({ message: "User already belongs to a team" });
  }

  // Validate request body
  const { error } = teamValidation.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const team = new Team({
      name: req.body.name,
      description: req.body.description,
      adminId: req.user._id
    });

    await team.save();

    // Assign teamId to admin
    req.user.teamId = team._id;
    await req.user.save();

    // Optionally populate admin info
    await team.populate('adminId', 'name email');

    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create team" });
  }
});

// ----------------------
// GET TEAM MEMBERS
// ----------------------
router.get('/:teamId/members', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate('adminId', 'name email');
    if (!team) return res.status(404).json({ message: "Team not found" });

    const members = await User.find({ teamId: team._id }).select('name role email');

     
    res.json({ team, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get team members" });
  }
});

// ----------------------
// GET TEAM ACTIVITY LOGS
// ----------------------
router.get('/:teamId/activity', authenticate, async (req, res) => {
  try {
    const teamId = req.params.teamId;

    // Get last 50 tasks sorted by update time
    const tasks = await Task.find({ teamId })
      .populate('assignedTo', 'name role')
      .sort({ updatedAt: -1 })
      .limit(50);

    // Get last 50 messages sorted by creation time
    const messages = await Message.find({ teamId })
      .populate('senderId', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ tasks, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get activity logs" });
  }
});

module.exports = router;
