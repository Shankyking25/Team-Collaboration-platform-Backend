const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const taskValidation = require('../../validations/taskValidation');







// PUT /api/tasks/:taskId/assign
router.put('/:taskId/assign', async (req, res) => {
  const { assignedTo } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name');

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign task' });
  }
});






router.get('/', authenticate, async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ message: 'projectId query parameter is required' });

  try {
    // Remove teamId filter if you don't have it in schema
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tasks = await Task.find({ projectId }).populate('assignedTo', 'name');
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});





router.post('/', authenticate, async (req, res) => {
  const { error } = taskValidation.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const project = await Project.findById(req.body.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Normalize status to match enum
    let status = req.body.status || "Todo"; // default
    status = status
      .replace(/-/g, " ") // replace hyphen with space
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const validStatuses = ["Todo", "In Progress", "Done"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = new Task({
      projectId: req.body.projectId,
      title: req.body.title,
      description: req.body.description || "",
      status,
      assignedTo: req.body.assignedTo || null,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create task', error: err.message });
  }
});





router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (
      req.user.role !== 'ADMIN' &&
    //  req.user.role !== 'MANAGER' &&
      (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString())
    )
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });




       // Validate status if provided
    if (req.body.status) {
      const validStatuses = ["Todo", "In Progress", "Done"];
      // Capitalize first letter of each word to match enum
      const formattedStatus = req.body.status
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      if (!validStatuses.includes(formattedStatus)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      req.body.status = formattedStatus;
    }

 // Update task
    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Allow ADMIN to delete any task
    if (req.user.role !== 'ADMIN' && task.projectId.teamId.toString() !== req.user.teamId.toString())
      return res.status(403).json({ message: 'Access denied' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
