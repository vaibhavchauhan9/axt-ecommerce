import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Settings, LogOut, User as UserIcon, MapPin, CreditCard, Bell, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function AccountLayout() {
  const { user, logoutUser } = useAuth();
  const { unreadCount } = useNotifications();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
      isActive
        ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white'
        : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'
    }`;

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="glass-card p-6 border border-white/5 mb-6 text-center md:text-left">
            <div className="relative w-16 h-16 mx-auto md:mx-0 mb-4">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user?.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-accentNeon" />
              ) : (
                <div className="w-16 h-16 bg-neutral-900 border-2 border-brand-accentNeon rounded-full flex items-center justify-center">
                  <UserIcon size={24} className="text-brand-accentNeon" />
                </div>
              )}
            </div>
            <h2 className="font-display font-black text-xl uppercase truncate">{user?.name}</h2>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest">{user?.email}</p>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink to="/profile" end className={navItemClass}>
              <Settings size={16} /> Profile Settings
            </NavLink>
            <NavLink to="/profile/addresses" className={navItemClass}>
              <MapPin size={16} /> Saved Addresses
            </NavLink>
            <NavLink to="/profile/cards" className={navItemClass}>
              <CreditCard size={16} /> Saved Cards
            </NavLink>
            <NavLink to="/profile/notifications" className={navItemClass}>
              <Bell size={16} /> Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-brand-accentNeon text-black text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </NavLink>

            <NavLink to="/orders" className={navItemClass}>
              <Package size={16} /> My Orders
            </NavLink>

            <button
              onClick={logoutUser}
              className="flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all mt-4"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        {/* Active page renders here */}
        <main className="flex-1 glass-card p-6 md:p-8 border border-white/5 min-h-[500px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
