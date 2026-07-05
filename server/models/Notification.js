import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'A notification title is required.'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'A notification message is required.'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['ORDER', 'PROMO', 'SYSTEM', 'ACCOUNT'],
      default: 'SYSTEM',
    },
    link: {
      // Optional relative frontend path the notification should deep-link to, e.g. /profile
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Optimizes the common "unread notifications for this user, newest first" query
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
