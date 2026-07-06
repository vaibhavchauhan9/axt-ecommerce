import React, { useState, useEffect } from 'react';
import { Package, Settings, LogOut, ArrowRight, User as UserIcon, MapPin, CreditCard, Heart, Bell, ShoppingCart, Trash2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import apiClient from '../services/apiClient';
import AddressBook from '../components/profile/AddressBook';
import SavedCards from '../components/profile/SavedCards';
import OrderDetailsModal from '../components/profile/OrderDetailsModal';

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

  const handleMoveToCart = async (product) => {
    if (!product.sizes?.length) return;
    setMovingId(product._id);
    const colorName = product.colors?.[0]?.name || 'Standard';
    const colorHex = product.colors?.[0]?.hex || '#000000';
    await addItemToCart(product._id, 1, product.sizes[0], colorName, colorHex);
    await toggleWishlistItem(product._id);
    setMovingId(null);
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

        </main>
      </div>

      {selectedOrderId && (
        <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </div>
  );
}
