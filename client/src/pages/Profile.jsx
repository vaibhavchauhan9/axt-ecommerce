import React, { useState, useEffect } from 'react';
import { Package, Settings, LogOut, ArrowRight, User as UserIcon, MapPin, CreditCard, Heart, Bell, ShoppingCart, Trash2, Check, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import apiClient from '../services/apiClient';
import AddressBook from '../components/profile/AddressBook';
import SavedCards from '../components/profile/SavedCards';
import OrderDetailsModal from '../components/profile/OrderDetailsModal';
import MyReturns from '../components/profile/MyReturns';
import { updateTokenInPlace } from '../utils/tokenStorage';

export default function Profile() {
  const { user, logoutUser } = useAuth();
  const { wishlist, wishlistLoading, toggleWishlistItem } = useWishlist();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { addItemToCart } = useCart();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);

  // Profile Update State
  const [updateData, setUpdateData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [updateStatus, setUpdateStatus] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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
    const fetchMyOrders = async () => {
      try {
        const { data } = await apiClient.get('/orders/my-orders');
        setOrders(data.data.orders);
      } catch (error) {
        console.error('Failed to retrieve logistics logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateStatus('Updating...');
    try {
      await apiClient.patch('/users/update-me', updateData);
      setUpdateStatus('Identity parameters updated successfully.');
      setTimeout(() => setUpdateStatus(''), 3000);
    } catch (error) {
      setUpdateStatus('Update failed. Verify data format.');
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

  const handleMoveToCart = async (product) => {
    if (!product.sizes?.length) return;
    setMovingId(product._id);
    const colorName = product.colors?.[0]?.name || 'Standard';
    const colorHex = product.colors?.[0]?.hex || '#000000';
    await addItemToCart(product._id, 1, product.sizes[0], colorName, colorHex);
    await toggleWishlistItem(product._id);
    setMovingId(null);
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

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation Matrix */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="glass-card p-6 border border-white/5 mb-6 text-center md:text-left">
            <div className="w-16 h-16 bg-neutral-900 border-2 border-brand-accentNeon rounded-full flex items-center justify-center mx-auto md:mx-0 mb-4">
              <UserIcon size={24} className="text-brand-accentNeon" />
            </div>
            <h2 className="font-display font-black text-xl uppercase truncate">{user?.name}</h2>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest">{user?.email}</p>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'orders' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <Package size={16} /> Logistics Logs
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <Settings size={16} /> Identity Settings
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
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'wishlist' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <Heart size={16} /> Wishlist
              {wishlist.length > 0 && (
                <span className="ml-auto bg-white/10 text-[10px] font-black px-2 py-0.5 rounded-full">{wishlist.length}</span>
              )}
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
            <button 
              onClick={() => setActiveTab('returns')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'returns' ? 'bg-brand-accentNeon/10 border border-brand-accentNeon text-white' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900'}`}
            >
              <RotateCcw size={16} /> Returns
            </button>
            <button 
              onClick={logoutUser}
              className="flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all mt-4"
            >
              <LogOut size={16} /> Terminate Session
            </button>
          </nav>
        </aside>

        {/* Dynamic Display Board */}
        <main className="flex-1 glass-card p-6 md:p-8 border border-white/5 min-h-[500px]">
          
          {/* Order Tracking Tab */}
          {activeTab === 'orders' && (
            <div>
              <h3 className="font-display font-black text-2xl uppercase tracking-wider mb-8 flex items-center gap-3">
                <Package className="text-brand-accentNeon" /> Acquisition History
              </h3>
              
              {loading ? (
                <div className="animate-pulse flex flex-col gap-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-900 rounded-xl" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-4">No active logistics found.</p>
                  <a href="/shop" className="text-brand-accentNeon hover:underline text-xs font-bold uppercase tracking-widest">Deploy to Shop <ArrowRight size={14} className="inline" /></a>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map(order => (
                    <div
                      key={order._id}
                      onClick={() => setSelectedOrderId(order._id)}
                      className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-[10px] text-neutral-500 font-mono tracking-widest mb-1">ID: {order._id}</p>
                        <p className="text-sm font-bold text-white mb-2">Total: ₹{order.totalPrice.toFixed(2)}</p>
                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : order.orderStatus === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-right w-full md:w-auto text-xs text-neutral-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-md">
              <h3 className="font-display font-black text-2xl uppercase tracking-wider mb-8 flex items-center gap-3">
                <Settings className="text-brand-accentNeon" /> Security & Profile
              </h3>

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Designation (Name)</label>
                  <input 
                    type="text" 
                    value={updateData.name}
                    onChange={(e) => setUpdateData({...updateData, name: e.target.value})}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Comms Link (Phone)</label>
                  <input 
                    type="text" 
                    value={updateData.phoneNumber}
                    onChange={(e) => setUpdateData({...updateData, phoneNumber: e.target.value})}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full btn-primary py-3">Sync Parameters</button>
                  {updateStatus && (
                    <p className={`text-xs mt-3 text-center font-bold tracking-widest uppercase ${updateStatus.includes('failed') ? 'text-red-400' : 'text-brand-accentNeon'}`}>
                      {updateStatus}
                    </p>
                  )}
                </div>
              </form>

              <div className="border-t border-white/10 mt-10 pt-8">
                <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-6">Change Password</h4>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
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

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h3 className="font-display font-black text-2xl uppercase tracking-wider mb-8 flex items-center gap-3">
                <Heart className="text-brand-accentNeon" /> Your Wishlist
              </h3>

              {wishlistLoading && wishlist.length === 0 ? (
                <div className="animate-pulse flex flex-col gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-neutral-900 rounded-xl" />)}
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-4">
                    Your wishlist is empty.
                  </p>
                  <a href="/shop" className="text-brand-accentNeon hover:underline text-xs font-bold uppercase tracking-widest">
                    Explore Products <ArrowRight size={14} className="inline" />
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {wishlist.map((product) => {
                    const activePrice = product.discountPrice || product.price;
                    const outOfStock = product.stock === 0;
                    return (
                      <div key={product._id} className="bg-neutral-900/40 border border-white/5 rounded-xl overflow-hidden flex flex-col">
                        <a href={`/product/${product.slug}`} className="relative w-full aspect-[3/4] bg-neutral-900 overflow-hidden block">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-700 font-display font-black text-xl">AXT</div>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); toggleWishlistItem(product._id); }}
                            className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-2 rounded-full text-red-500 hover:bg-black/80 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </a>
                        <div className="p-3 flex flex-col gap-1 flex-1">
                          <h4 className="font-bold text-xs uppercase text-white line-clamp-1">{product.name}</h4>
                          <span className="font-black text-sm text-brand-accentNeon">₹{activePrice?.toFixed(2)}</span>
                          <button
                            onClick={() => handleMoveToCart(product)}
                            disabled={outOfStock || movingId === product._id}
                            className="mt-auto w-full flex items-center justify-center gap-2 bg-white text-black text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg hover:bg-brand-accentNeon transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShoppingCart size={12} />
                            {movingId === product._id ? 'Moving...' : outOfStock ? 'Unavailable' : 'Move to Bag'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

          {/* Returns Tab */}
          {activeTab === 'returns' && (
            <div>
              <h3 className="font-display font-black text-2xl uppercase tracking-wider mb-8 flex items-center gap-3">
                <RotateCcw className="text-brand-accentNeon" /> Returns & Refunds
              </h3>
              <MyReturns />
            </div>
          )}

        </main>
      </div>

      {selectedOrderId && (
        <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </div>
  );
}
