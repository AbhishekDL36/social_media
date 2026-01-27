const nodemailer = require('nodemailer');

// Check if email credentials are configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('WARNING: Email credentials not configured in .env file');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendOTP = async (email, otp) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Socialix - Email Verification OTP',
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <h3 style="color: #0095f6;">${otp}</h3>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
    return true;
  } catch (err) {
    console.error('Error sending OTP:', err.message);
    return false;
  }
};

module.exports = { sendOTP };
