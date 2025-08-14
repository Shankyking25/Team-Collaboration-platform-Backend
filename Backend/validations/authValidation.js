const Joi = require('joi');

const registerValidation = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'MEMBER').required(),
  teamId: Joi.string().optional(),
  password: Joi.string().min(6).optional(), // password handled by Firebase, optional here
});

const loginValidation = Joi.object({
  token: Joi.string().required(),
});

module.exports = { registerValidation, loginValidation };
