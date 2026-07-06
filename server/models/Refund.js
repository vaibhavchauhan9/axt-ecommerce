import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    returnRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'Return', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    // How the money actually moves back to the customer.
    method: {
      type: String,
      enum: ['ORIGINAL_PAYMENT_METHOD', 'STORE_CREDIT', 'BANK_TRANSFER'],
      default: 'ORIGINAL_PAYMENT_METHOD',
    },
    // Gateway used to process the refund, if via the original payment method.
    gateway: { type: String, enum: ['STRIPE', 'RAZORPAY', 'MANUAL', null], default: null },
    gatewayRefundId: { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    failureReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin who triggered it
  },
  { timestamps: true }
);

refundSchema.index({ order: 1 });
refundSchema.index({ user: 1, createdAt: -1 });

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
