const nodemailer = require('nodemailer');

// Check if Brevo credentials are configured
if (!process.env.BREVO_SMTP_PASSWORD) {
  console.warn('WARNING: BREVO_SMTP_PASSWORD not configured in .env file');
}

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: 'a0f5b5001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_PASSWORD
  }
});

const sendOTP = async (email, otp) => {
  try {
    if (!process.env.BREVO_SMTP_PASSWORD) {
      throw new Error('Brevo SMTP password not configured. Set BREVO_SMTP_PASSWORD in .env');
    }

    await transporter.sendMail({
      from: 'noreply@socialix.com',
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
