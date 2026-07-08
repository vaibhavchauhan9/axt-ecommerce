import React, { useState, useEffect, useRef } from 'react';
import { Settings, User as UserIcon, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { updateTokenInPlace } from '../utils/tokenStorage';

export default function AccountSettings() {
  const { user, logoutUser, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  const [updateData, setUpdateData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    age: user?.age || '',
    gender: user?.gender || '',
  });
  const [updateStatus, setUpdateStatus] = useState('');

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.profileImage || '');

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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
    setAvatarPreview(URL.createObjectURL(file));
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

  const inputClass = 'w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon';
  const labelClass = 'text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2';

  return (
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
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
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
  );
}
