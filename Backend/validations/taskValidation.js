const Joi = require('joi');

const taskValidation = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('Todo', 'In Progress', 'Done').optional(),tatus: Joi.string().valid('todo', 'in-progress', 'done').optional(),
  projectId: Joi.string().required(),
  assignedTo: Joi.string().optional(),
});

module.exports = taskValidation;
