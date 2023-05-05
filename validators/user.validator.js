const Joi = require('joi');
const { validateRequest } = require('../utilities/commonFunctions');

const requestParameterTypes = {
  body: 'body',
  query: 'query',
  params: 'param'
};

const JoiInstance = Joi.defaults(schema => {
  return schema.options({
    errors: {
      wrap: {
        // Remove quotes from variable names in error messages
        label: false
      }
    }
  });
});

const signup = (req, res, next) => {
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  const passwordError =
    'Password must be strong. At least one upper case alphabet. At least one lower case alphabet. At least one digit. At least one special character.';

  const schema = JoiInstance.object().keys({
    name: Joi.string().required(),
    password: Joi.string().min(8).max(20).pattern(new RegExp(passwordPattern)).required().messages({
      'string.min': 'Password should have at least 8 characters',
      'string.max': 'Password should have at most 20 characters',
      'string.pattern.base': passwordError,
      'any.required': 'Password is required'
    }),
    email: Joi.string().email().required(),
    user_name: Joi.string().alphanum().min(3).max(30).label('username')
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.body);
};

const login = (req, res, next) => {
  const schema = JoiInstance.object().keys({
    nick_name: Joi.alternatives().try(Joi.string().email(), Joi.string().alphanum().min(3).max(30)).required().label('email/username'),
    password: Joi.string().required()
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.body);
};

const verifyAccount = (req, res, next) => {
  const schema = JoiInstance.object().keys({
    userId: Joi.string().required(),
    confirmationCode: Joi.string().required()
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.params);
};

const resendLink = (req, res, next) => {
  const schema = JoiInstance.object().keys({
    email: Joi.string().email().required()
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.body);
};

module.exports = {
  signup,
  login,
  verifyAccount,
  resendLink
};
