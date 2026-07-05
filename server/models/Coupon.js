import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required.'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, 'Discount value cannot be negative.'],
    },
    minCartValue: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number, // only relevant for percentage coupons, caps the discount
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number, // total number of times this coupon can be used across all users
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Validates a coupon against a cart subtotal and returns { valid, message, discountAmount }
couponSchema.methods.validateForCart = function (subtotal) {
  if (!this.isActive) {
    return { valid: false, message: 'This coupon is no longer active.' };
  }
  if (this.expiresAt && this.expiresAt < new Date()) {
    return { valid: false, message: 'This coupon has expired.' };
  }
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'This coupon has reached its usage limit.' };
  }
  if (subtotal < this.minCartValue) {
    return {
      valid: false,
      message: `Add ₹${(this.minCartValue - subtotal).toFixed(2)} more to use this coupon.`,
    };
  }

  let discountAmount =
    this.discountType === 'percentage'
      ? (subtotal * this.discountValue) / 100
      : this.discountValue;

  if (this.discountType === 'percentage' && this.maxDiscountAmount !== null) {
    discountAmount = Math.min(discountAmount, this.maxDiscountAmount);
  }

  // Never let the discount exceed the cart subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return { valid: true, discountAmount: Math.round(discountAmount * 100) / 100 };
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
