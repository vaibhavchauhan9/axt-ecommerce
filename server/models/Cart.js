import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity metric must represent at least one unit context.'],
    default: 1,
  },
  size: {
    type: String,
    required: true,
  },
  color: {
    name: { type: String, required: true },
    hex: { type: String, required: true },
  },
  // NEW: marks an item as parked in "Save for Later" instead of the active cart
  savedForLater: {
    type: Boolean,
    default: false,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One persistent card stack index record per user context
    },
    items: [cartItemSchema],
    // NEW: currently applied coupon snapshot (denormalized so past totals stay stable)
    coupon: {
      code: { type: String, default: null },
      discountType: { type: String, enum: ['percentage', 'flat'], default: null },
      discountValue: { type: Number, default: null },
      discountAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
