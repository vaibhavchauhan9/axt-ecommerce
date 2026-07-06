import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name.'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [function () { return !this.googleId; }, 'Please provide a secure password.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false, // Ensures the password field isn't leaked by default in queries
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    addresses: [
      {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    // NEW: Saved payment methods — ONLY masked/display data is ever stored here.
    // Full card numbers and CVVs are never persisted; a real integration would
    // send the raw card details straight to Stripe/Razorpay and store only the
    // token + these display fields that come back from the processor.
    savedCards: [
      {
        cardHolderName: { type: String, required: true, trim: true },
        brand: {
          type: String,
          enum: ['Visa', 'Mastercard', 'Amex', 'RuPay', 'Other'],
          default: 'Other',
        },
        last4: {
          type: String,
          required: true,
          match: [/^\d{4}$/, 'last4 must be exactly 4 digits.'],
        },
        expiryMonth: { type: Number, required: true, min: 1, max: 12 },
        expiryYear: { type: Number, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetOTP: {
      type: String,
      select: false,
    },
    passwordResetOTPExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
      select: false,
    },
    emailVerificationOTPExpires: {
      type: Date,
      select: false,
    },
    googleId: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save Middleware: Automatic Password Cryptography
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Account for clock skew
  }
  next();
});

// Instance Method: Verify Password Integrity
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance Method: Detect Password Variance Post Token Issue
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance Method: Generate a random 6-digit OTP, persist only its SHA-256 hash + 10-min expiry,
// and return the PLAIN otp so it can be emailed to the user (never stored in plaintext).
userSchema.methods.createPasswordResetOTP = function () {
  const otp = crypto.randomInt(100000, 999999).toString();

  this.passwordResetOTP = crypto.createHash('sha256').update(otp).digest('hex');
  this.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp;
};

// Instance Method: Verify a submitted OTP against the stored hash and expiry window
userSchema.methods.verifyPasswordResetOTP = function (candidateOtp) {
  if (!this.passwordResetOTP || !this.passwordResetOTPExpires) return false;
  if (this.passwordResetOTPExpires < Date.now()) return false;

  const hashedCandidate = crypto.createHash('sha256').update(candidateOtp).digest('hex');
  return hashedCandidate === this.passwordResetOTP;
};

// Instance Method: Generate a 6-digit email-verification OTP (same hash-and-expire pattern
// as the password-reset OTP), used at registration to confirm the address is real.
userSchema.methods.createEmailVerificationOTP = function () {
  const otp = crypto.randomInt(100000, 999999).toString();

  this.emailVerificationOTP = crypto.createHash('sha256').update(otp).digest('hex');
  this.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp;
};

// Instance Method: Verify the submitted email-verification OTP against the stored hash and expiry
userSchema.methods.verifyEmailVerificationOTP = function (candidateOtp) {
  if (!this.emailVerificationOTP || !this.emailVerificationOTPExpires) return false;
  if (this.emailVerificationOTPExpires < Date.now()) return false;

  const hashedCandidate = crypto.createHash('sha256').update(candidateOtp).digest('hex');
  return hashedCandidate === this.emailVerificationOTP;
};

const User = mongoose.model('User', userSchema);
export default User;
