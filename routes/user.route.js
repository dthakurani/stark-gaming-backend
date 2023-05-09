const { Router } = require('express');

const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const { genericResponse } = require('../utilities/responseHandler');

const router = Router();

router.post('/', userValidator.signup, userController.signup, genericResponse);
router.post('/login', userValidator.login, userController.login, genericResponse);
router.get('/confirmation/:userId/:confirmationCode', userValidator.verifyAccount, userController.verifyAccount, genericResponse);
router.post('/resend-link', userValidator.resendLink, userController.resendLink, genericResponse);
router.post('/forget-password', userValidator.forgetPassword, userController.forgetPassword, genericResponse);
router.post('/reset-password', userValidator.resetPassword, userController.resetPassword, genericResponse);

module.exports = router;
