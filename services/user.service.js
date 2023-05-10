const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
const { Fernet } = require('fernet-nodejs');

const model = require('../models');
const { CustomException } = require('../utilities/errorHandler');
const { responseMessages } = require('../constants');
const { sequelize } = require('../models');
const userHelper = require('../helpers/user.helper');
const mailer = require('../utilities/mail');

const signup = async payload => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, password, user_name: userName } = payload;
    const hashedPassword = await bcrypt.hash(password, 10);

    // check if email is exist into database
    const existingUser = await model.User.findOne({
      where: { email }
    });
    if (existingUser) throw new CustomException(responseMessages.ALREADY_LINK_EMAIL, 409);

    // save user in database
    const newUser = await model.User.create(
      {
        name,
        email,
        password: hashedPassword,
        user_name: userName
      },
      transaction
    );
    const mailStatus = await userHelper.generateAndStoreConfirmationCode(newUser.id, email, transaction); // generate token
    const signupResponse = mailStatus === 'success' ? responseMessages.VERIFY_EMAIL_SUCCESS_SEND : responseMessages.VERIFY_EMAIL_FAILURE_SEND;

    await transaction.commit();
    return signupResponse;
  } catch (error) {
    console.log(Error);
    await transaction.rollback();
    throw new CustomException('No added by found');
  }
};

const login = async payload => {
  const { nick_name: nickName, password } = payload;

  const userNameOrEmailWhereQuery = {};
  if (nickName.indexOf('@') === -1) {
    userNameOrEmailWhereQuery.user_name = nickName;
  } else {
    userNameOrEmailWhereQuery.email = nickName;
  }

  const existingUser = await model.User.findOne({
    where: {
      userNameOrEmailWhereQuery
    }
  });

  // check for user is in database
  if (!existingUser) {
    throw new CustomException(responseMessages.INCORRECT_EMAIL_USERNAME_PASSWORD, 401);
  }

  const passwordIsValid = await bcrypt.compare(password, existingUser.password); // compare user's password

  if (!passwordIsValid) throw new CustomException(responseMessages.INCORRECT_EMAIL_USERNAME_PASSWORD, 401);
  // check user is active or not
  else if (!existingUser.active) {
    throw new CustomException(responseMessages.UNVERIFIED_EMAIL, 401);
  }

  const existingLogin = await model.UserLogin.findOne({ user_id: existingUser.id }); // check for already login

  if (existingLogin) await model.UserLogin.destroy({ user_id: existingUser.id }); // delete existing login entry

  const refreshTokenId = `${crypto.randomUUID()}-${new Date().getTime()}`;
  const accessTokenId = `${crypto.randomUUID()}-${new Date().getTime()}`;

  // generate access and refresh token
  const refreshToken = jwt.sign({ userId: existingUser.id, tokenId: refreshTokenId }, process.env.REFRESH_SECRET_KEY, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES
  });
  const accessToken = jwt.sign({ userId: existingUser.id, tokenId: accessTokenId }, process.env.ACCESS_SECRET_KEY, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES
  });

  const decodeAccessToken = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
  const refreshTokenExpireTime = decodeAccessToken.exp;

  const body = {
    user_id: existingUser.id,
    refresh_token_id: refreshTokenId,
    access_token_id: accessTokenId,
    refresh_token_expire_time: refreshTokenExpireTime
  };
  await model.UserLogin.create(body);

  const tokens = {
    refreshToken,
    accessToken
  };

  return {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    userName: existingUser.user_name,
    tokens
  };
};

const verifyAccount = async (userId, confirmationCode) => {
  const existingUser = await model.User.findOne({ where: { id: userId } });
  if (!existingUser) throw new CustomException(responseMessages.INVALID_CONFIRMATION_CODE_USER_MAPPING, 404);

  if (existingUser.active) return responseMessages.ALREADY_VERIFIED; // user is already verified

  const existingConfirmationCodeString = Buffer.from(confirmationCode, 'base64').toString();
  const confirmationCodeDecrypt = Fernet.decrypt(existingConfirmationCodeString, process.env.ENCRYPT_KEY);

  if (existingUser.confirmation_code.code !== confirmationCodeDecrypt.code || existingUser.confirmation_code.expires < new Date().getTime()) {
    if (!existingUser) throw new CustomException(responseMessages.EXPIRE_CONFIRMATION_CODE, 498);
  }
  // activate user
  await model.User.update({ active: true, confirmation_code: null }, { where: { id: userId } });
  return responseMessages.SUCCESSFULLY_VERIFIED;
};

const resendLink = async email => {
  const existingUser = await model.User.findOne({ email });
  if (!existingUser) throw new CustomException(responseMessages.EMAIL_NOT_FOUND, 404);
  if (existingUser.active) return responseMessages.ALREADY_VERIFIED; // user is already verified
  const mailStatus = await userHelper.generateAndStoreConfirmationCode(existingUser.id, existingUser.email); // generate token

  if (mailStatus === 'success') {
    return responseMessages.VERIFY_EMAIL_SUCCESS_SEND;
  }
  return responseMessages.VERIFY_EMAIL_FAILURE_SEND;
};

const forgetPassword = async email => {
  const existingUser = await model.User.findOne({ where: { email } });
  if (!existingUser) throw new CustomException(responseMessages.EMAIL_NOT_FOUND, 404);
  const resetPasswordToken = `${crypto.randomUUID()}-${new Date().getTime()}`;
  const resetPasswordLink = `${process.env.APP_BASE_URL}/api/user/reset-password/${existingUser.id}/${resetPasswordToken}`;
  let resetPasswordLinkExpires = new Date();
  resetPasswordLinkExpires = resetPasswordLinkExpires.setMinutes(resetPasswordLinkExpires.getMinutes() + 15);
  await model.User.update(
    {
      reset_password_token: resetPasswordToken,
      reset_password_expires: resetPasswordLinkExpires
    },
    { where: { id: existingUser.id } }
  );
  const templatePath = path.resolve('./templates/forgetPassword.ejs');
  const template = await ejs.renderFile(templatePath, { reset_password_link: resetPasswordLink });
  // reset password link email sent to user
  const mailStatus = await mailer.sendMail({
    to: email,
    subject: 'Reset Password',
    html: template
  });
  if (mailStatus === 'success') {
    return responseMessages.FORGET_PASSWORD_MAIL_SUCCESS;
  }
  return responseMessages.MAIL_FAILURE;
};

const resetPassword = async payload => {
  const existingUserWithToken = await model.User.findOne({
    id: payload.user_id,
    reset_password_token: payload.reset_password_token
  });
  if (!existingUserWithToken) throw new CustomException(responseMessages.INVALID_RESET_PASSWORD_TOKEN, 404);
  const currentTime = new Date().getTime();
  if (currentTime > existingUserWithToken.reset_password_expires) throw new CustomException(responseMessages.EXPIRED_RESET_PASSWORD_TOKEN, 498);
  // password update
  await model.User.update(
    { password: await bcrypt.hash(payload.password, 10), reset_password_token: null, reset_password_expires: null },
    { where: { id: payload.user_id } }
  );
  const templatePath = path.resolve('./templates/resetPassword.ejs');
  const template = await ejs.renderFile(templatePath);
  // reset password link email sent to user
  const mailStatus = await mailer.sendMail({
    to: existingUserWithToken.email,
    subject: 'Password reset successful',
    html: template
  });
  if (mailStatus === 'success') {
    return responseMessages.RESET_PASSWORD_MAIL_SUCCESS;
  }
  return responseMessages.MAIL_FAILURE;
};

module.exports = {
  signup,
  login,
  verifyAccount,
  resendLink,
  forgetPassword,
  resetPassword
};
