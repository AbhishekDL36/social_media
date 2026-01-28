const axios = require('axios');

// Check if Brevo API key is configured
if (!process.env.BREVO_API_KEY) {
  console.warn('WARNING: BREVO_API_KEY not configured in .env file');
}

const sendOTP = async (email, otp) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('Brevo API key not configured. Set BREVO_API_KEY in .env');
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: {
        name: 'Socialix',
        email: 'noreply@socialix.com'
      },
      to: [
        {
          email: email
        }
      ],
      subject: 'Socialix - Email Verification OTP',
      htmlContent: `
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <h3 style="color: #0095f6;">${otp}</h3>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return true;
  } catch (err) {
    console.error('Error sending OTP:', err.message);
    return false;
  }
};

module.exports = { sendOTP };
