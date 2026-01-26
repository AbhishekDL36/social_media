const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTP } = require('../config/email');
const { validatePassword, validateEmail, validateUsername, generateOTP } = require('../utils/validation');

const router = express.Router();

// Send OTP for email verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const otp = generateOTP();
    
    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });
    
    // Save new OTP
    await OTP.create({ email, otp });

    // Send OTP to email
    const sent = await sendOTP(email, otp);
    
    if (!sent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent to email', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register with OTP verification
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    // Validation
    if (!username || !email || !password || !otp) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ 
        message: 'Username must be 3-20 characters, alphanumeric and underscores only' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character (@$!%*?&)' 
      });
    }

    // Check if username is unique
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Check if email is unique
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({ email, otp });
    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Delete OTP after successful registration
    await OTP.deleteOne({ _id: otpDoc._id });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      userId: user._id, 
      username: user.username,
      message: 'Registration successful' 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send OTP for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }

    const otp = generateOTP();
    
    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });
    
    // Save new OTP with purpose
    await OTP.create({ email, otp, purpose: 'password_reset' });

    // Send OTP to email
    const sent = await sendOTP(email, otp);
    
    if (!sent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent to email', email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character (@$!%*?&)' 
      });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({ email, otp });
    if (!otpDoc) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // Delete OTP after successful password reset
    await OTP.deleteOne({ _id: otpDoc._id });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
