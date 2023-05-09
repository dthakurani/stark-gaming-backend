const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const model = require('../models');
const { CustomException } = require('../utilities/errorHandler');
const { responseMessages } = require('../constants');
const { sequelize } = require('../models');
const userHelper = require('../helpers/user.helper');

const signup = async payload => {
  const transaction = await sequelize.transaction();
  try {
    const { name, email, password, user_name: userName } = payload;
    const hashedPassword = await bcrypt.hash(password, 10);

    // check if email is exist into database
    const existingUser = await model.User.findOne({
      email
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
    userNameOrEmailWhereQuery
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
  const existingConfirmationCode = await model.User.findOne({ confirmation_code: confirmationCode });

  if (!existingConfirmationCode) throw new CustomException(responseMessages.EXPIRE_CONFIRMATION_CODE, 498);

  const existingUser = await model.User.findOne({ user_id: userId, email: existingConfirmationCode.email });
  if (!existingUser) throw new CustomException(responseMessages.INVALID_CONFIRMATION_CODE_USER_MAPPING, 401); // not valid user
  if (existingUser.active) return responseMessages.ALREADY_VERIFIED; // user is already verified
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

module.exports = {
  signup,
  login,
  verifyAccount,
  resendLink
};
