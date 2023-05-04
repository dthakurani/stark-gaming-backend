const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Fernet } = require('fernet-nodejs');
const ejs = require('ejs');
const path = require('path');

const model = require('../models');
const { CustomException } = require('../utilities/errorHandler');
const mailer = require('../utilities/mail');

const signup = async payload => {
  const { name, email, password, user_name: userName } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);

  // check if email is exist into database
  const existingUser = await model.User.findOne({
    email
  });
  if (existingUser) throw CustomException('This email address is already associated with another account.', 409);

  // generate token
  let confirmationCode = {
    code: Fernet.generateKey(),
    expires: new Date().getTime() + 20 * 60 * 1000
  };
  confirmationCode = JSON.stringify(confirmationCode);
  let encryptConfirmationCode = Fernet.encrypt(confirmationCode, process.env.ENCRYPT_KEY);
  encryptConfirmationCode = Buffer.from(encryptConfirmationCode).toString('base64');
  // save user in database
  await model.User.create({
    name,
    email,
    password: hashedPassword,
    user_name: userName,
    confirmation_code: encryptConfirmationCode
  });
  const emailVerificationLink = `${process.env.BASE_URL}/${encryptConfirmationCode}`;
  const templatePath = path.resolve('./templates/emailVerification.ejs');
  const template = await ejs.renderFile(templatePath, { email_verification_link: emailVerificationLink });
  // verify email sent to user
  const mailStatus = await mailer.sendMail({
    to: email,
    subject: 'Email Verification',
    html: template
  });
  console.log(mailStatus);
  if (mailStatus === 'success') {
    return `A verification email has been sent to ${email}. It will be expire after one day. If you not get verification Email click on resend token.`;
  }
  return 'Technical Issue!, Please click on resend for verify your Email.';
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
    userNameOrEmailWhereQuery
  });

  // check for user is in database
  if (!existingUser) {
    throw CustomException('email/username or password is incorrect. please check and try again.', 401);
  }

  const passwordIsValid = await bcrypt.compare(password, existingUser.password); // compare user's password

  if (!passwordIsValid) throw CustomException('email/username or password is incorrect. please check and try again.', 401);
  // check user is active or not
  else if (!existingUser.active) {
    throw CustomException('Your Email has not been verified. Please click on resend', 401);
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

module.exports = {
  signup,
  login
};
