const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const VerificationToken = require('../models/VerificationToken');
const { saveLogToDB } = require('../middleware/logger');
const { sendEmail } = require('../config/emailConfig');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Check Login Attempts
const checkLoginAttempts = async (email, ipAddress) => {
  const attempt = await LoginAttempt.findOne({ email, ipAddress });

  if (attempt) {
    if (attempt.blockedUntil && attempt.blockedUntil > new Date()) {
      const remainingTime = Math.ceil((attempt.blockedUntil - new Date()) / (1000 * 60));
      throw new Error(`Account is temporarily blocked. Please try again after ${remainingTime} minutes`);
    }

    if (attempt.blockedUntil && attempt.blockedUntil <= new Date()) {
      attempt.attempts = 1;
      attempt.blockedUntil = null;
    } else {
      attempt.attempts += 1;

      if (attempt.attempts >= 3) {
        attempt.blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour block
        await attempt.save();
        throw new Error('Too many failed attempts. Account blocked for 1 hour');
      }
    }
    attempt.lastAttempt = new Date();
    await attempt.save();
  } else {
    await LoginAttempt.create({
      email,
      ipAddress,
      attempts: 1,
      lastAttempt: new Date(),
    });
  }
};

// Reset Login Attempts
const resetLoginAttempts = async (email, ipAddress) => {
  await LoginAttempt.findOneAndDelete({ email, ipAddress });
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ipAddress = req.ip;

    if (!name || !email || !password) {
      await saveLogToDB('warn', 'Registration attempt with missing fields', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Please add all fields');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      await saveLogToDB('warn', 'Weak password attempt during registration', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      await saveLogToDB('warn', `Registration attempt with existing email: ${email}`, req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('User already exists');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await VerificationToken.create({
      email,
      token: verificationToken,
      password: hashedPassword,
      name,
      role: 'user',
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailContent = `
      <h1>Email Verification</h1>
      <p>Hello ${name},</p>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <p><a href="${verificationUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't register for an account, please ignore this email.</p>
    `;

    const emailSent = await sendEmail(email, 'Email Verification', emailContent);

    if (!emailSent) {
      await saveLogToDB('error', `Failed to send verification email to: ${email}`, req.method, req.originalUrl, 500);
      res.status(500);
      throw new Error('Failed to send verification email');
    }

    await saveLogToDB('info', `Registration initiated for: ${email}`, req.method, req.originalUrl, 200);
    res.status(200).json({
      message: 'Registration successful. Please check your email to verify your account.',
      email,
    });
  } catch (error) {
    await saveLogToDB('error', `Registration error: ${error.message}`, req.method, req.originalUrl, 500);
    throw error;
  }
});

// Verify Email
const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      await saveLogToDB('warn', 'Email verification attempt without token', req.method, req.originalUrl, 400);
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const verificationRecord = await VerificationToken.findOne({ token });

    if (!verificationRecord) {
      await saveLogToDB('warn', 'Invalid or expired verification token', req.method, req.originalUrl, 400);
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

    const existingUser = await User.findOne({ email: verificationRecord.email });

    if (existingUser && existingUser.isVerified) {
      await saveLogToDB('info', `User already verified: ${verificationRecord.email}`, req.method, req.originalUrl, 200);
      return res.status(200).json({
        success: true,
        message: 'Email already verified. Please set your password or log in.',
        email: verificationRecord.email,
      });
    }

    if (existingUser && !existingUser.isVerified) {
      existingUser.isVerified = true;
      existingUser.name = verificationRecord.name;
      existingUser.password = verificationRecord.password;
      await existingUser.save();

      await VerificationToken.deleteOne({ token });

      await saveLogToDB('info', `Email verified for existing user: ${verificationRecord.email}`, req.method, req.originalUrl, 200);
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully.',
        email: verificationRecord.email,
      });
    }

    const user = await User.create({
      name: verificationRecord.name,
      email: verificationRecord.email,
      password: verificationRecord.password,
      role: verificationRecord.role,
      isVerified: true,
      registrationIP: req.ip,
    });

    await VerificationToken.deleteOne({ token });

    await saveLogToDB('info', `Email verified successfully for: ${verificationRecord.email}`, req.method, req.originalUrl, 200);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      email: verificationRecord.email,
    });
  } catch (error) {
    await saveLogToDB('error', `Email verification error: ${error.message}`, req.method, req.originalUrl, 500);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    await checkLoginAttempts(email, ipAddress);

    const user = await User.findOne({ email });

    if (!user) {
      await saveLogToDB('warn', `Failed login attempt for non-existent user: ${email}`, req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      await saveLogToDB('warn', `Login attempt for unverified account: ${email}`, req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Please verify your email before logging in');
    }

    if (await bcrypt.compare(password, user.password)) {
      await resetLoginAttempts(email, ipAddress);

      user.lastLogin = new Date();
      await user.save();

      await saveLogToDB('info', `User logged in successfully: ${email}`, req.method, req.originalUrl, 200);
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      await saveLogToDB('warn', `Failed login attempt for: ${email}`, req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    await saveLogToDB('error', `Login error: ${error.message}`, req.method, req.originalUrl, 500);
    throw error;
  }
});

// Request Password Reset (formerly resetPassword, renamed for clarity)
const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      await saveLogToDB('warn', 'Password reset request attempt without email', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Please provide an email address');
    }

    const user = await User.findOne({ email });
    if (!user) {
      await saveLogToDB('warn', `Password reset request for non-existent email: ${email}`, req.method, req.originalUrl, 404);
      res.status(404);
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await VerificationToken.create({
      email,
      token: resetToken,
    });

    const emailContent = `
      <h1>Password Reset</h1>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this reset, please ignore this email and ensure your account is secure.</p>
    `;

    const emailSent = await sendEmail(email, 'Password Reset Request', emailContent);

    if (!emailSent) {
      await saveLogToDB('error', `Failed to send password reset email to: ${email}`, req.method, req.originalUrl, 500);
      res.status(500);
      throw new Error('Failed to send password reset email');
    }

    await saveLogToDB('info', `Password reset initiated for: ${email}`, req.method, req.originalUrl, 200);
    res.status(200).json({
      message: 'Password reset link sent to your email',
      email,
    });
  } catch (error) {
    await saveLogToDB('error', `Password reset request error: ${error.message}`, req.method, req.originalUrl, 500);
    throw error;
  }
});

// Reset Password (formerly requestPasswordReset, renamed for clarity)
// Reset Password (Updated to use email instead of token)
const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      await saveLogToDB('warn', 'Password reset attempt with missing fields', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Please provide email, new password, and confirm password');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      await saveLogToDB('warn', 'Weak password attempt during reset', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
    }

    if (newPassword !== confirmPassword) {
      await saveLogToDB('warn', 'Password reset attempt with mismatched passwords', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Passwords do not match');
    }

    const user = await User.findOne({ email });
    if (!user) {
      await saveLogToDB('warn', `User not found for reset: ${email}`, req.method, req.originalUrl, 404);
      res.status(404);
      throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await resetLoginAttempts(email, req.ip);

    await saveLogToDB('info', `Password reset successful for: ${email}`, req.method, req.originalUrl, 200);
    res.status(200).json({
      message: 'Password reset successful',
      email,
    });
  } catch (error) {
    await saveLogToDB('error', `Password reset error: ${error.message}`, req.method, req.originalUrl, 500);
    res.status(500).json({ message: error.message });
  }
});

// Set Password
const setPassword = asyncHandler(async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      await saveLogToDB('warn', 'Password set attempt with missing fields', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Please provide email, password, and confirm password');
    }

    if (password !== confirmPassword) {
      await saveLogToDB('warn', 'Password mismatch during set attempt', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Passwords do not match');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      await saveLogToDB('warn', 'Weak password during set attempt', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
    }

    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      await saveLogToDB('warn', 'User not found or not verified for password set', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('User not found or not verified');
    }

    const verificationRecord = await VerificationToken.findOne({ email });
    if (!verificationRecord) {
      await saveLogToDB('warn', 'No valid verification token found for password set', req.method, req.originalUrl, 400);
      res.status(400);
      throw new Error('No valid verification token found. Please request a new password set link.');
    }

    if (!verificationRecord.name || !verificationRecord.password) {
      await saveLogToDB('error', 'Verification token is malformed: missing required fields', req.method, req.originalUrl, 500);
      res.status(500);
      throw new Error('Verification token is malformed. Please contact support.');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    await VerificationToken.deleteOne({ email });

    const token = generateToken(user._id);

    await saveLogToDB('info', `Password set successfully for: ${email}`, req.method, req.originalUrl, 200);
    res.status(200).json({
      message: 'Password set successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    await saveLogToDB('error', `Password set error: ${error.message}`, req.method, req.originalUrl, 500);
    res.status(500).json({ message: error.message });
  }
});

// Check Verification Token Validity
const checkVerificationToken = asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      await saveLogToDB('warn', 'Token check attempt without token', req.method, req.originalUrl, 400);
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    const verificationRecord = await VerificationToken.findOne({ token });

    if (!verificationRecord) {
      await saveLogToDB('warn', 'Invalid or expired token check', req.method, req.originalUrl, 400);
      return res.status(400).json({ valid: false, message: 'Invalid or expired token' });
    }

    await saveLogToDB('info', `Valid token check for: ${verificationRecord.email}`, req.method, req.originalUrl, 200);
    res.status(200).json({
      valid: true,
      email: verificationRecord.email,
      message: 'Token is valid',
    });
  } catch (error) {
    await saveLogToDB('error', `Token check error: ${error.message}`, req.method, req.originalUrl, 500);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  setPassword,
  checkVerificationToken,
};