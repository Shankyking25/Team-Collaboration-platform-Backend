const Joi = require('joi');

const projectValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
});

module.exports = projectValidation;
