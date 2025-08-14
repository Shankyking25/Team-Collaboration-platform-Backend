const Joi = require('joi');

const teamValidation = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  description: Joi.string().allow("").optional()
});

module.exports = teamValidation;
