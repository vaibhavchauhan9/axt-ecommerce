import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function AccountNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const timeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const units = [['y', 31536000], ['mo', 2592000], ['d', 86400], ['h', 3600], ['m', 60]];
    for (const [label, secs] of units) {
      const value = Math.floor(seconds / secs);
      if (value >= 1) return `${value}${label} ago`;
    }
    return 'just now';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
          <Bell className="text-brand-accentNeon" /> Notifications
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-accentNeon hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                !notification.isRead ? 'bg-brand-accentNeon/5 border-brand-accentNeon/20' : 'bg-neutral-900/40 border-white/5'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white">{notification.title}</p>
                  {!notification.isRead && <span className="w-1.5 h-1.5 rounded-full bg-brand-accentNeon shrink-0" />}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">{notification.message}</p>
                <span className="text-[10px] text-neutral-600 font-mono mt-2 block">{timeAgo(notification.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {!notification.isRead && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                    className="text-neutral-500 hover:text-brand-accentNeon transition-colors"
                    aria-label="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                  className="text-neutral-500 hover:text-red-400 transition-colors"
                  aria-label="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
