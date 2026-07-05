import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Package, Megaphone, Settings, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const typeIcon = {
  ORDER: Package,
  PROMO: Megaphone,
  ACCOUNT: Settings,
  SYSTEM: Info,
};

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ];
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return 'just now';
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null; // Bell only makes sense for logged-in users

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="hover:text-[#FAB116] transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#FAB116] text-black font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-4 w-80 max-w-[90vw] bg-neutral-950 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold uppercase tracking-widest text-brand-accentNeon hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcon[notification.type] || Info;
                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-neutral-900 ${
                      !notification.isRead ? 'bg-brand-accentNeon/5' : ''
                    }`}
                  >
                    <div className="shrink-0 w-8 h-8 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center">
                      <Icon size={14} className="text-brand-accentNeon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">{notification.title}</p>
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accentNeon shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-neutral-600 font-mono">{timeAgo(notification.createdAt)}</span>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="text-neutral-500 hover:text-brand-accentNeon transition-colors"
                              aria-label="Mark as read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="text-neutral-500 hover:text-red-400 transition-colors"
                            aria-label="Delete notification"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
