const { Fernet } = require('fernet-nodejs');
const ejs = require('ejs');
const path = require('path');

const mailer = require('../utilities/mail');
const model = require('../models');

const generateAndStoreConfirmationCode = async (userId, email, transaction = null) => {
  let confirmationCode = {
    code: Fernet.generateKey(),
    expires: new Date().getTime() + 20 * 60 * 1000
  };
  confirmationCode = JSON.stringify(confirmationCode);
  let encryptConfirmationCode = Fernet.encrypt(confirmationCode, process.env.ENCRYPT_KEY);
  encryptConfirmationCode = Buffer.from(encryptConfirmationCode).toString('base64');

  await model.User.update({ confirmation_code: confirmationCode }, { where: { email } }, transaction);

  const emailVerificationLink = `${process.env.APP_BASE_URL}/user/verify/${userId}/${encryptConfirmationCode}`;
  const templatePath = path.resolve('./templates/emailVerification.ejs');
  const template = await ejs.renderFile(templatePath, { email_verification_link: emailVerificationLink });
  // verify email sent to user
  const mailStatus = await mailer.sendMail({
    to: email,
    subject: 'Email Verification',
    html: template
  });
  return mailStatus;
};

module.exports = {
  generateAndStoreConfirmationCode
};
