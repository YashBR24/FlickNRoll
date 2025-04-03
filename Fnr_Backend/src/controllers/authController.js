const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const VerificationToken = require('../models/VerificationToken');
const { log } = require('../middleware/logger'); // Updated import
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
const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phoneNumber, gender, dateOfBirth, role } = req.body;

    if (!name || !email || !password || !confirmPassword || !phoneNumber || !gender || !dateOfBirth) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      gender,
      dateOfBirth,
      role,
      isVerified: false, // Ensure user is unverified until email confirmation
    });

    const token = crypto.randomBytes(32).toString('hex');
    const verificationToken = new VerificationToken({
      email,
      token,
      password: hashedPassword,
      name,
      role,
      phoneNumber,
      gender,
      dateOfBirth,
    });

    await verificationToken.save();
    await user.save();

    // Construct verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const emailContent = `
      <h1>Email Verification</h1>
      <p>Thank you for registering! Please click the link below to verify your email:</p>
      <p><a href="${verificationLink}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
    `;

    const emailSent = await sendEmail(email, 'Verify Your Email', emailContent);
    if (!emailSent) {
      return res.status(500).json({ message: 'User registered, but email could not be sent' });
    }

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    console.log(error);
  }
};

// Verify Email
const verifyEmail = asyncHandler(async (req, res) => {
  try {
    log('VERIFYING_EMAIL');

    const { token } = req.query;

    if (!token) {
      log('MISSING_TOKEN_EMAIL_VERIFICATION');
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const verificationRecord = await VerificationToken.findOne({ token });

    if (!verificationRecord) {
      log('INVALID_OR_EXPIRED_TOKEN');
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

    const existingUser = await User.findOne({ email: verificationRecord.email });

    if (existingUser && existingUser.isVerified) {
      log(`USER_ALREADY_VERIFIED_${verificationRecord.email}`);
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
      existingUser.dateOfBirth = verificationRecord.dateOfBirth;
      existingUser.gender = verificationRecord.gender;
      existingUser.phoneNumber = verificationRecord.phoneNumber;
      await existingUser.save();

      await VerificationToken.deleteOne({ token });

      log(`EMAIL_VERIFIED_EXISTING_USER_${verificationRecord.email}`);
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
      dateOfBirth: verificationRecord.dateOfBirth,
      phoneNumber: verificationRecord.phoneNumber,
      gender: verificationRecord.gender,
      role: verificationRecord.role,
      isVerified: true,
      registrationIP: req.ip,
    });

    await VerificationToken.deleteOne({ token });

    log(`EMAIL_VERIFIED_${verificationRecord.email}`);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      email: verificationRecord.email,
    });
  } catch (error) {
    log(`ERROR_VERIFYING_EMAIL_${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  try {
    log('LOGGING_IN_USER');

    const { email, password } = req.body;
    const ipAddress = req.ip;

    await checkLoginAttempts(email, ipAddress);

    const user = await User.findOne({ email });

    if (!user) {
      log(`LOGIN_ATTEMPT_NON_EXISTENT_USER_${email}`);
      res.status(400);
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      log(`LOGIN_ATTEMPT_UNVERIFIED_ACCOUNT_${email}`);
      res.status(400);
      throw new Error('Please verify your email before logging in');
    }

    if (await bcrypt.compare(password, user.password)) {
      await resetLoginAttempts(email, ipAddress);

      user.lastLogin = new Date();
      await user.save();

      log(`USER_LOGGED_IN_${email}`);
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      log(`FAILED_LOGIN_ATTEMPT_${email}`);
      res.status(400);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    log(`ERROR_LOGGING_IN_${error.message}`);
    throw error;
  }
});

// Request Password Reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
    log('REQUESTING_PASSWORD_RESET');

    const { email } = req.body;

    if (!email) {
      log('MISSING_EMAIL_PASSWORD_RESET');
      res.status(400);
      throw new Error('Please provide an email address');
    }

    const user = await User.findOne({ email });
    if (!user) {
      log(`PASSWORD_RESET_NON_EXISTENT_EMAIL_${email}`);
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
      log(`FAILED_TO_SEND_RESET_EMAIL_${email}`);
      res.status(500);
      throw new Error('Failed to send password reset email');
    }

    log(`PASSWORD_RESET_INITIATED_${email}`);
    res.status(200).json({
      message: 'Password reset link sent to your email',
      email,
    });
  } catch (error) {
    log(`ERROR_REQUESTING_PASSWORD_RESET_${error.message}`);
    throw error;
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  try {
    log('RESETTING_PASSWORD');

    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      log('MISSING_FIELDS_PASSWORD_RESET');
      res.status(400);
      throw new Error('Please provide email, new password, and confirm password');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      log('WEAK_PASSWORD_RESET_ATTEMPT');
      res.status(400);
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
    }

    if (newPassword !== confirmPassword) {
      log('MISMATCHED_PASSWORDS_RESET');
      res.status(400);
      throw new Error('Passwords do not match');
    }

    const user = await User.findOne({ email });
    if (!user) {
      log(`USER_NOT_FOUND_RESET_${email}`);
      res.status(404);
      throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await resetLoginAttempts(email, req.ip);

    log(`PASSWORD_RESET_SUCCESSFUL_${email}`);
    res.status(200).json({
      message: 'Password reset successful',
      email,
    });
  } catch (error) {
    log(`ERROR_RESETTING_PASSWORD_${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// Set Password
const setPassword = asyncHandler(async (req, res) => {
  try {
    log('SETTING_PASSWORD');

    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      log('MISSING_FIELDS_SET_PASSWORD');
      res.status(400);
      throw new Error('Please provide email, password, and confirm password');
    }

    if (password !== confirmPassword) {
      log('MISMATCHED_PASSWORDS_SET');
      res.status(400);
      throw new Error('Passwords do not match');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      log('WEAK_PASSWORD_SET_ATTEMPT');
      res.status(400);
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
    }

    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
      log(`USER_NOT_FOUND_OR_UNVERIFIED_${email}`);
      res.status(400);
      throw new Error('User not found or not verified');
    }

    const verificationRecord = await VerificationToken.findOne({ email });
    if (!verificationRecord) {
      log(`NO_VALID_TOKEN_SET_PASSWORD_${email}`);
      res.status(400);
      throw new Error('No valid verification token found. Please request a new password set link.');
    }

    if (!verificationRecord.name || !verificationRecord.password) {
      log('MALFORMED_VERIFICATION_TOKEN');
      res.status(500);
      throw new Error('Verification token is malformed. Please contact support.');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    await VerificationToken.deleteOne({ email });

    const token = generateToken(user._id);

    log(`PASSWORD_SET_SUCCESSFUL_${email}`);
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
    log(`ERROR_SETTING_PASSWORD_${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

// Check Verification Token Validity
const checkVerificationToken = asyncHandler(async (req, res) => {
  try {
    log('CHECKING_VERIFICATION_TOKEN');

    const { token } = req.params;

    if (!token) {
      log('MISSING_TOKEN_CHECK');
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    const verificationRecord = await VerificationToken.findOne({ token });

    if (!verificationRecord) {
      log('INVALID_OR_EXPIRED_TOKEN_CHECK');
      return res.status(400).json({ valid: false, message: 'Invalid or expired token' });
    }

    log(`VALID_TOKEN_CHECK_${verificationRecord.email}`);
    res.status(200).json({
      valid: true,
      email: verificationRecord.email,
      message: 'Token is valid',
    });
  } catch (error) {
    log(`ERROR_CHECKING_TOKEN_${error.message}`);
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