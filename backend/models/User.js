const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // Existing accounts remain usable; registration explicitly sets this to false.
  emailVerified: { type: Boolean, default: true },
  emailOtpHash: { type: String, select: false },
  emailOtpExpiresAt: { type: Date, select: false },
  emailOtpAttempts: { type: Number, default: 0, select: false },
  emailOtpLastSentAt: { type: Date, select: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
