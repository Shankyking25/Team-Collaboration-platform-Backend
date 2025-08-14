const bcrypt = require('bcryptjs')
const express = require('express');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const router = express.Router();

// helper: sign JWT
function sign(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * POST /api/auth/register
 * Creates Firebase user + stores user in MongoDB (hashed password) + returns backend JWT.
 */
router.post("/register", async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("ADMIN", "MANAGER", "MEMBER").default("MEMBER")
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, email, password, role } = value;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    // create Firebase user (ok if already there, but we checked in Mongo)
    await admin.auth().createUser({ email, password, displayName: name });

    const user = await User.create({ name, email, password: hash, role });

    const token = sign(user);
    return res.status(201).json({
      message: "Registered",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (e) {
    // If Firebase says email exists, still return conflict
    if (e?.errorInfo?.code === "auth/email-already-exists") {
      return res.status(409).json({ message: "Email already in use (Firebase)" });
    }
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/login
 * Verifies MongoDB (bcrypt) and returns backend JWT + profile.
 * (Firebase sign-in on frontend is optional with this flow; we issue our own JWT.)
 */
router.post("/login", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = value;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = sign(user);
    return res.json({
      message: "Logged in",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

