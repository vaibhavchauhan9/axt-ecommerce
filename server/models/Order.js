import mongoose from 'mongoose';

// Canonical forward progression of the fulfilment pipeline. Used by the
// controller to validate status transitions (CANCELLED is always allowed
// separately, from any non-terminal state).
export const ORDER_STATUS_SEQUENCE = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'READY_TO_SHIP',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      // Permanently fixed — see userController/orderController for the server-side enforcement.
      state: { type: String, required: true, enum: ['Uttar Pradesh'], default: 'Uttar Pradesh' },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, enum: ['India'], default: 'India' },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['STRIPE', 'RAZORPAY', 'COD'],
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      updateTime: { type: String },
      emailAddress: { type: String },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    // NEW: snapshot of any coupon applied at checkout time, re-validated server-side
    coupon: {
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    // Full production fulfilment pipeline. Existing statuses (PENDING, PACKED,
    // SHIPPED, DELIVERED, CANCELLED) are preserved for backward compatibility;
    // CONFIRMED, READY_TO_SHIP and OUT_FOR_DELIVERY are new intermediate stages.
    orderStatus: {
      type: String,
      required: true,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PACKED',
        'READY_TO_SHIP',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },
    // Append-only audit trail of every status change — powers the customer-facing
    // tracking timeline and gives admins a history of who/when for each order.
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    // Courier / shipment metadata. Populated by admin when an order is marked
    // READY_TO_SHIP / SHIPPED. Kept as a plain sub-object (not required) so
    // existing orders created before this feature remain valid.
    tracking: {
      trackingNumber: { type: String, default: null },
      courierName: { type: String, default: null },
      courierPhone: { type: String, default: null },
      courierTrackingUrl: { type: String, default: null },
      estimatedDeliveryDate: { type: Date, default: null },
    },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

// Automatically append a statusHistory entry any time orderStatus changes,
// regardless of which controller/route made the change (admin panel,
// payment webhook, future courier-sync jobs, etc). This keeps the audit
// trail complete without requiring every call-site to remember to push to it.
orderSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('orderStatus')) {
    this.statusHistory.push({
      status: this.orderStatus,
      note: this.$locals.pendingNote || undefined,
      updatedAt: new Date(),
    });
  }
  next();
});

// Indexes optimizing Admin Analytics tracking queries
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
