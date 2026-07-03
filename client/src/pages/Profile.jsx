import React, { useState, useEffect } from 'react';
import { Package, Settings, LogOut, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

export default function Profile() {
  const { user, logoutUser } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Update State
  const [updateData, setUpdateData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [updateStatus, setUpdateStatus] = useState('');

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
                    <div key={order._id} className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-colors">
                      <div>
                        <p className="text-[10px] text-neutral-500 font-mono tracking-widest mb-1">ID: {order._id}</p>
                        <p className="text-sm font-bold text-white mb-2">Total: ₹{order.totalPrice.toFixed(2)}</p>
                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {order.orderStatus}
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
          
        </main>
      </div>
    </div>
  );
}