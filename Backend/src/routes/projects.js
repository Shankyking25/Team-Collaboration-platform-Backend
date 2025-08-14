const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const projectValidation = require('../../validations/projectValidation');




router.get("/", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const project = new Project({ name, description });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




router.put('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Role-based restriction
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    // Optional: Team restriction (only if needed)
    if (req.user.teamId && project.teamId && project.teamId.toString() !== req.user.teamId.toString()) {
      return res.status(403).json({ message: 'Forbidden: project not in your team' });
    }

    // Validate incoming data (if you still want)
    const { error } = projectValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Update fields
    Object.assign(project, req.body);
    await project.save();

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});





router.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, message: 'Project deleted', data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
