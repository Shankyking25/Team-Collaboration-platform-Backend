const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');
const messageValidation = require('../../validations/projectValidation');


router.post('/', authenticate, async (req, res) => {
  console.log("User ID:", req.user._id); // check user ID
  console.log("Team ID:", req.user.teamId); // check team ID

  const { error } = messageValidation.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    if (!req.user.teamId) {
      console.log("No team assigned for this user!");
      return res.status(400).json({ message: 'User has no team' });
    }

    const message = new Message({
      content: req.body.content,
      senderId: req.user._id,
      teamId: req.user.teamId,
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save message' });
  }
});





router.get('/', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ teamId: req.user.teamId })
      .populate("senderId", "name")
      .sort({ createdAt: 1 }); // <-- sort by creation time

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
