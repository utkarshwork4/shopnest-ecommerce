const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');
const getOtpMessage = (otp) => `
  <h2>Welcome to ShopNest!</h2>
  <p>Your email verification code is: <strong>${otp}</strong></p>
  <p>This code expires in 10 minutes.</p>
`;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const emailOtpHash = await bcrypt.hash(otp, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      emailOtpHash,
      emailOtpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      emailOtpAttempts: 0,
    });
    if (user) {
      const emailSent = await sendEmail({
        email: user.email,
        subject: 'Verify your ShopNest email',
        message: getOtpMessage(otp),
      });

      if (!emailSent) {
        return res.status(503).json({
          message: 'Your account was created, but we could not send the verification email. Please try Resend OTP again.',
          email: user.email,
          verificationRequired: true,
          emailSent: false,
        });
      }

      const sentAt = new Date();
      await User.updateOne({
        _id: user._id,
        emailVerified: false,
        emailOtpHash,
      }, { $set: { emailOtpLastSentAt: sentAt } });

      return res.status(201).json({
        message: 'Registration successful. Verify your email to activate your account.',
        email: user.email,
        verificationRequired: true,
        retryAfterSeconds: 60,
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Enter the email used to register.' });
    }

    const user = await User.findOne({ email }).select('+emailOtpLastSentAt');
    if (!user || user.emailVerified) {
      return res.status(404).json({ message: 'No unverified registration was found for this email.' });
    }

    const now = Date.now();
    if (user.emailOtpLastSentAt) {
      const elapsed = now - user.emailOtpLastSentAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
          retryAfterSeconds,
        });
      }
    }

    const otp = generateOtp();
    const emailOtpHash = await bcrypt.hash(otp, 10);
    const reservationAt = new Date(now);
    const updateFilter = { _id: user._id, emailVerified: false };
    if (user.emailOtpLastSentAt) {
      updateFilter.emailOtpLastSentAt = user.emailOtpLastSentAt;
    } else {
      updateFilter.$or = [
        { emailOtpLastSentAt: { $exists: false } },
        { emailOtpLastSentAt: null },
      ];
    }
    const reservedUser = await User.findOneAndUpdate(updateFilter, {
      $set: { emailOtpLastSentAt: reservationAt },
    }, { new: true }).select('email');
    if (!reservedUser) {
      return res.status(429).json({
        message: 'An OTP was just requested. Please wait 60 seconds before trying again.',
        retryAfterSeconds: 60,
      });
    }

    const emailSent = await sendEmail({
      email: reservedUser.email,
      subject: 'Your ShopNest verification code',
      message: getOtpMessage(otp),
    });

    if (!emailSent) {
      const rollbackUpdate = user.emailOtpLastSentAt
        ? { $set: { emailOtpLastSentAt: user.emailOtpLastSentAt } }
        : { $unset: { emailOtpLastSentAt: 1 } };
      await User.updateOne({
        _id: user._id,
        emailVerified: false,
        emailOtpLastSentAt: reservationAt,
      }, rollbackUpdate);

      return res.status(503).json({
        message: 'We could not send the verification email. Your existing code was not changed; please try again.',
        emailSent: false,
      });
    }

    const sentAt = new Date();
    const updatedUser = await User.findOneAndUpdate({
      _id: user._id,
      emailVerified: false,
      emailOtpLastSentAt: reservationAt,
    }, {
      $set: {
        emailOtpHash,
        emailOtpExpiresAt: new Date(sentAt.getTime() + OTP_EXPIRY_MS),
        emailOtpAttempts: 0,
        emailOtpLastSentAt: sentAt,
      },
    }, { new: true }).select('email');
    if (!updatedUser) {
      return res.status(409).json({
        message: 'Your email was verified while the new code was being sent. Please log in.',
        emailSent: true,
      });
    }

    return res.json({
      message: 'A new verification code has been sent.',
      emailSent: true,
      retryAfterSeconds: 60,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (typeof email !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Enter a valid 6-digit OTP.' });
    }

    const user = await User.findOne({ email }).select(
      '+emailOtpHash +emailOtpExpiresAt +emailOtpAttempts +emailOtpLastSentAt'
    );
    if (!user) {
      return res.status(404).json({ message: 'No registration was found for this email.' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: 'This email is already verified.' });
    }
    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res.status(400).json({ message: 'No active OTP was found for this email.' });
    }
    if (user.emailOtpExpiresAt.getTime() <= Date.now()) {
      await User.updateOne({
        _id: user._id,
        emailVerified: false,
        emailOtpHash: user.emailOtpHash,
        emailOtpExpiresAt: user.emailOtpExpiresAt,
      }, {
        $set: { emailOtpAttempts: 0 },
        $unset: { emailOtpHash: 1, emailOtpExpiresAt: 1 },
      });
      return res.status(400).json({ message: 'OTP has expired.' });
    }
    const currentAttempts = user.emailOtpAttempts || 0;
    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        message: 'Too many incorrect attempts. Request a new OTP to continue.',
        attemptsExceeded: true,
      });
    }
    if (!(await bcrypt.compare(otp, user.emailOtpHash))) {
      const updatedUser = await User.findOneAndUpdate({
        _id: user._id,
        emailVerified: false,
        emailOtpHash: user.emailOtpHash,
        emailOtpExpiresAt: { $gt: new Date() },
        $or: [
          { emailOtpAttempts: { $lt: MAX_OTP_ATTEMPTS } },
          { emailOtpAttempts: { $exists: false } },
        ],
      }, { $inc: { emailOtpAttempts: 1 } }, { new: true }).select('+emailOtpAttempts');
      if (!updatedUser || updatedUser.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
        return res.status(429).json({
          message: 'Too many incorrect attempts. Request a new OTP to continue.',
          attemptsExceeded: true,
        });
      }
      return res.status(400).json({ message: 'The OTP is incorrect. Please try again.' });
    }

    const verificationResult = await User.updateOne({
      _id: user._id,
      emailVerified: false,
      emailOtpHash: user.emailOtpHash,
      emailOtpExpiresAt: { $eq: user.emailOtpExpiresAt, $gt: new Date() },
    }, {
      $set: { emailVerified: true, emailOtpAttempts: 0 },
      $unset: {
        emailOtpHash: 1,
        emailOtpExpiresAt: 1,
        emailOtpLastSentAt: 1,
      },
    });
    if (verificationResult.matchedCount === 0) {
      return res.status(400).json({ message: 'This OTP is no longer active. Request a new OTP.' });
    }

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.emailVerified) {
        return res.status(403).json({
          message: 'Please verify your email before logging in.',
          verificationRequired: true,
        });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, resendEmailOtp, verifyEmailOtp, loginUser, getUsers };
