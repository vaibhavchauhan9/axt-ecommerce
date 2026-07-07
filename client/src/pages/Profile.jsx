import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, User as UserIcon, MapPin, CreditCard, Bell, Check, Trash2, Camera, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import apiClient from '../services/apiClient';
import AddressBook from '../components/profile/AddressBook';
import SavedCards from '../components/profile/SavedCards';
import { updateTokenInPlace } from '../utils/tokenStorage';

export default function Profile() {
  const { user, logoutUser, refreshUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('settings');
  const fileInputRef = useRef(null);

  // Profile Update State
  const [updateData, setUpdateData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    age: user?.age || '',
    gender: user?.gender || '',
  });
  const [updateStatus, setUpdateStatus] = useState('');

  // Avatar Upload State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.profileImage || '');

  // Change Password State
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    setAvatarPreview(user?.profileImage || '');
  }, [user?.profileImage]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateStatus('Updating...');
    try {
      const payload = { ...updateData };
      if (payload.age === '') delete payload.age;
      await apiClient.patch('/users/update-me', payload);
      setUpdateStatus('Profile updated successfully.');
      setTimeout(() => setUpdateStatus(''), 3000);
    } catch (error) {
      setUpdateStatus(error.response?.data?.message || 'Update failed. Verify data format.');
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setAvatarPreview(URL.createObjectURL(file)); // instant local preview while uploading
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await apiClient.post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarPreview(data.data.user.profileImage);
      if (refreshUser) refreshUser(data.data.user);
    } catch (error) {
      setAvatarError(error.response?.data?.message || 'Failed to upload image.');
      setAvatarPreview(user?.profileImage || '');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordStatus('New password must be at least 8 characters.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const { data } = await apiClient.put('/users/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      updateTokenInPlace(data.accessToken);
      setPasswordStatus('Password updated successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus(''), 3000);
    } catch (error) {
      setPasswordStatus(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteSubmitting(true);
    try {
      await apiClient.delete('/users/delete-me', { data: { password: deletePassword } });
      await logoutUser();
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Failed to delete account.');
      setDeleteSubmitting(false);
    }
  };

  const timeAgo = (dateString) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const units = [['y', 31536000], ['mo', 2592000], ['d', 86400], ['h', 3600], ['m', 60]];
    for (const [label, secs] of units) {
      const value = Math.floor(seconds / secs);
      if (value >= 1) return `${value}${label} ago`;
    }
    return 'just now';
  };

  const inputClass = 'w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon';
  const labelClass = 'text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2';

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="glass-card p-6 border border-white/5 mb-6 text-center md:text-left">
            <div className="relative w-16 h-16 mx-auto md:mx-0 mb-4">
              {avatarPreview ? (
                <img src={avatarPreview} alt={user?.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand-accentNeon" />
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
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <Settings size={16} /> Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'addresses' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <MapPin size={16} /> Saved Addresses
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'cards' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <CreditCard size={16} /> Saved Cards
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'notifications' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <Bell size={16} /> Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-brand-accentNeon text-black text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>

            <Link
              to="/orders"
              className="flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900 transition-all"
            >
              <Package size={16} /> My Orders
            </Link>

            <button
              onClick={logoutUser}
              className="flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all mt-4"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 glass-card p-6 md:p-8 border border-white/5 min-h-[500px]">

          {/* Profile Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-md">
              <h3 className="font-display font-black text-2xl uppercase tracking-wider mb-8 flex items-center gap-3">
                <Settings className="text-brand-accentNeon" /> Profile Settings
              </h3>

              {/* Profile Image Upload */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative w-20 h-20 shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                  ) : (
                    <div className="w-20 h-20 bg-neutral-900 border-2 border-white/10 rounded-full flex items-center justify-center">
                      <UserIcon size={28} className="text-neutral-600" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 bg-brand-accentNeon text-black p-1.5 rounded-full border-2 border-black hover:brightness-110 transition-all disabled:opacity-50"
                    aria-label="Change profile picture"
                  >
                    <Camera size={12} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Profile Picture</p>
                  <p className="text-[10px] text-neutral-500 mt-1">{avatarUploading ? 'Uploading...' : 'JPG or PNG, max 5MB'}</p>
                  {avatarError && <p className="text-[10px] text-red-400 mt-1">{avatarError}</p>}
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    type="text"
                    value={updateData.name}
                    onChange={(e) => setUpdateData({ ...updateData, name: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="text"
                    value={updateData.phoneNumber}
                    onChange={(e) => setUpdateData({ ...updateData, phoneNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Age</label>
                    <input
                      type="number"
                      min={13}
                      max={120}
                      value={updateData.age}
                      onChange={(e) => setUpdateData({ ...updateData, age: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select
                      value={updateData.gender}
                      onChange={(e) => setUpdateData({ ...updateData, gender: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full btn-primary py-3">Save Changes</button>
                  {updateStatus && (
                    <p className={`text-xs mt-3 text-center font-bold tracking-widest uppercase ${updateStatus.includes('failed') || updateStatus.includes('Failed') ? 'text-red-400' : 'text-brand-accentNeon'}`}>
                      {updateStatus}
                    </p>
                  )}
                </div>
              </form>

              <div className="border-t border-white/10 mt-10 pt-8">
                <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-6">Change Password</h4>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={passwordSubmitting} className="w-full btn-secondary py-3 disabled:opacity-50">
                      {passwordSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                    {passwordStatus && (
                      <p className={`text-xs mt-3 text-center font-bold tracking-widest uppercase ${passwordStatus.includes('success') ? 'text-brand-accentNeon' : 'text-red-400'}`}>
                        {passwordStatus}
                      </p>
                    )}
                  </div>
                </form>
              </div>

              <div className="border-t border-red-500/20 mt-10 pt-8">
                <h4 className="text-sm font-black uppercase tracking-widest text-red-400 mb-2">Danger Zone</h4>
                <p className="text-xs text-neutral-500 mb-4">Deleting your account deactivates it permanently. Your order history is kept for records, but you won't be able to log in again with this email.</p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-bold uppercase tracking-widest text-red-400 border border-red-500/30 rounded-lg px-5 py-3 hover:bg-red-500/10 transition-colors"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-5 flex flex-col gap-4">
                    <p className="text-xs text-red-400 font-bold">Enter your password to confirm — this cannot be undone.</p>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-red-400"
                    />
                    {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={deleteSubmitting}
                        onClick={handleDeleteAccount}
                        className="flex-1 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-lg py-3 hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleteSubmitting ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                        className="flex-1 bg-neutral-800 text-white text-xs font-black uppercase tracking-widest rounded-lg py-3 hover:bg-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved Addresses Tab */}
          {activeTab === 'addresses' && <AddressBook />}

          {/* Saved Cards Tab */}
          {activeTab === 'cards' && <SavedCards />}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
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
          )}

        </main>
      </div>
    </div>
  );
}
