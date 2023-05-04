const nodemailer = require('nodemailer');

require('dotenv').config();

async function sendMail(data) {
  const { to, cc, subject, html } = data;
  return new Promise(resolve => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
    const mailOptions = {
      from: {
        name: 'STARK-GAMING',
        address: process.env.MAIL_USER
      },
      to,
      subject,
      html,
      cc: cc || null
    };

    transporter.sendMail(mailOptions, error => {
      if (error) {
        resolve('error');
      } else {
        resolve('success');
      }
    });
  });
}

module.exports = {
  sendMail
};
