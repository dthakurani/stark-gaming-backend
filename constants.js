const responseMessages = {
  EXPIRE_CONFIRMATION_CODE: 'Your verification link may have expired. Please click on resend for verify your Email.',
  INCORRECT_EMAIL_USERNAME_PASSWORD: 'email/username or password is incorrect. please check and try again.',
  UNVERIFIED_EMAIL: 'Your Email has not been verified. Please click on resend',
  ALREADY_LINK_EMAIL: 'This email address is already associated with another account.',
  VERIFY_EMAIL_SUCCESS_SEND:
    'A verification email has been sent to your email. It will be expire after 20 minutes. If you not get verification Email click on resend token.',
  VERIFY_EMAIL_FAILURE_SEND: 'Technical Issue!, Please click on resend for verify your Email.',
  INVALID_CONFIRMATION_CODE_USER_MAPPING: 'We were unable to find a user for this verification. Please SignUp!',
  ALREADY_VERIFIED: 'User has been already verified. Please Login',
  SUCCESSFULLY_VERIFIED: 'Your account has been successfully verified',
  EMAIL_NOT_FOUND: 'We were unable to find a user with that email. Make sure your Email is correct!'
};

module.exports = {
  responseMessages
};
