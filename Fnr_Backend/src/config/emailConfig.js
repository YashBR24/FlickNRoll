const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Create transporter using environment variables
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'yashbradadiya21@gnu.ac.in',
      pass: process.env.EMAIL_APP_PASSWORD || 'bogodwmgqgqdrhsm'
    }
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = { sendEmail };