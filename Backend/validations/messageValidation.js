const Joi = require("joi");

const messageValidation = Joi.object({
  content: Joi.string().required(),
});

module.exports = messageValidation;
