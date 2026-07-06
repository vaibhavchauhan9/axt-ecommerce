import mongoose from 'mongoose';

// Canonical forward progression for a return/replacement/refund request.
// REJECTED is a terminal branch reachable from REQUESTED or APPROVED (handled
// in the controller, not enforced by the sequence itself).
export const RETURN_STATUS_SEQUENCE = [
  'REQUESTED',
  'APPROVED',
  'PICKUP_SCHEDULED',
  'PRODUCT_RECEIVED',
  'REFUND_PROCESSED',
];

const returnItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    size: { type: String, required: true },
    color: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // What the customer is asking for. REFUND = money back with no physical
    // exchange expected (e.g. item never arrived); RETURN = send item back for
    // a refund; REPLACEMENT = send item back, get a fresh one in exchange.
    requestType: {
      type: String,
      enum: ['RETURN', 'REPLACEMENT', 'REFUND'],
      required: true,
    },
    items: [returnItemSchema],
    reason: {
      type: String,
      required: [true, 'A reason is required for the return/refund request.'],
      enum: [
        'DAMAGED_OR_DEFECTIVE',
        'WRONG_ITEM_RECEIVED',
        'SIZE_FIT_ISSUE',
        'NOT_AS_DESCRIBED',
        'ITEM_NEVER_ARRIVED',
        'CHANGED_MIND',
        'OTHER',
      ],
    },
    description: { type: String, trim: true, maxlength: 1000 },
    images: [{ type: String }], // optional evidence photo URLs supplied by the customer
    status: {
      type: String,
      enum: [...RETURN_STATUS_SEQUENCE, 'REJECTED', 'CANCELLED'],
      default: 'REQUESTED',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: { type: String, default: null },
    pickup: {
      scheduledDate: { type: Date, default: null },
      address: { type: String, default: null },
    },
    // Populated once inspection/receipt happens at the warehouse.
    inspection: {
      receivedAt: { type: Date, default: null },
      condition: { type: String, default: null }, // e.g. "Sealed, unused" / "Damaged in transit"
      approvedForRefund: { type: Boolean, default: null },
    },
    refund: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },
  },
  { timestamps: true }
);

returnSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      note: this.$locals.pendingNote || undefined,
      updatedAt: new Date(),
    });
  }
  next();
});

returnSchema.index({ user: 1, createdAt: -1 });
returnSchema.index({ order: 1 });
returnSchema.index({ status: 1 });

const Return = mongoose.model('Return', returnSchema);
export default Return;
