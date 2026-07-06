import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';

// Internal helper (NOT a route handler) — import and call this from other controllers
// (e.g. orderController) whenever an event happens that a user should be told about.
// Usage: await createNotification({ user: order.user, title: '...', message: '...', type: 'ORDER', link: '/profile' });
export const createNotification = async ({ user, title, message, type = 'SYSTEM', link = null }) => {
  try {
    return await Notification.create({ user, title, message, type, link });
  } catch (error) {
    // Notification failures should never break the primary action (e.g. order creation)
    console.error('[Notification Engine] Failed to persist notification:', error.message);
    return null;
  }
};

// @desc    Fetch the authenticated user's notifications (newest first)
// @route   GET /api/v1/notifications
// @access  Private
export const getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.status(200).json({
    status: 'success',
    results: notifications.length,
    unreadCount,
    data: { notifications },
  });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    return next(new AppError('Notification not found.', 404));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    status: 'success',
    data: { notification },
  });
});

// @desc    Mark every notification belonging to the current user as read
// @route   PATCH /api/v1/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read.',
  });
});

// @desc    Delete a single notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    return next(new AppError('Notification not found.', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ==========================================================
// Admin: send notifications to customers
// ==========================================================

// @desc    Send a notification to a single customer, or broadcast to every customer
// @route   POST /api/v1/admin/notifications
// @access  Private/Admin
export const sendAdminNotification = asyncHandler(async (req, res, next) => {
  const { title, message, type = 'PROMO', link, target, userId } = req.body;

  if (!title?.trim() || !message?.trim()) {
    return next(new AppError('A title and message are required.', 400));
  }

  if (target === 'single') {
    if (!userId) {
      return next(new AppError('A customer must be selected for a single-recipient notification.', 400));
    }

    const customer = await User.findOne({ _id: userId, role: 'customer' });
    if (!customer) {
      return next(new AppError('Customer not found.', 404));
    }

    const notification = await Notification.create({
      user: customer._id,
      title: title.trim(),
      message: message.trim(),
      type,
      link: link || null,
    });

    return res.status(201).json({
      status: 'success',
      message: `Notification sent to ${customer.name}.`,
      data: { notification, recipientCount: 1 },
    });
  }

  // Default / target === 'all': broadcast to every customer account
  const customers = await User.find({ role: 'customer' }).select('_id');
  if (customers.length === 0) {
    return next(new AppError('No customers found to notify.', 404));
  }

  const docs = customers.map((customer) => ({
    user: customer._id,
    title: title.trim(),
    message: message.trim(),
    type,
    link: link || null,
  }));
  await Notification.insertMany(docs);

  res.status(201).json({
    status: 'success',
    message: `Notification broadcast to ${customers.length} customer${customers.length === 1 ? '' : 's'}.`,
    data: { recipientCount: customers.length },
  });
});
