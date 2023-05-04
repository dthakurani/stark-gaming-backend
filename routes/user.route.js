const { Router } = require('express');

const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const { genericResponse } = require('../utilities/responseHandler');

const router = Router();

router.post('/', userValidator.signup, userController.signup, genericResponse);
router.post('/login', userValidator.login, userController.login, genericResponse);

module.exports = router;
