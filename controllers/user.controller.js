const userService = require('../services/user.service');
const { commonErrorHandler } = require('../utilities/errorHandler');

const signup = async (req, res, next) => {
  try {
    const payload = req.body;
    const userCreateResponse = await userService.signup(payload);
    req.statusCode = 201;
    req.message = userCreateResponse;
    next();
  } catch (error) {
    console.log('signup error:', error);
    const statusCode = error.statusCode || 500;
    commonErrorHandler(req, res, error.message, statusCode, error);
  }
};

const login = async (req, res, next) => {
  try {
    const payload = req.body;
    const successLogin = await userService.login(payload);

    req.data = successLogin;
    req.message = 'successfully logged in.';
    next();
  } catch (error) {
    console.log('login error:', error);
    const statusCode = error.statusCode || 500;
    commonErrorHandler(req, res, error.message, statusCode, error);
  }
};

module.exports = {
  signup,
  login
};
