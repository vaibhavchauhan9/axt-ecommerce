import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, RotateCcw } from 'lucide-react';
import apiClient from '../services/apiClient';
import OrderDetailsModal from '../components/profile/OrderDetailsModal';
import MyReturns from '../components/profile/MyReturns';

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const fetchMyOrders = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/orders/my-orders');
        setOrders(data.data.orders);
      } catch (error) {
        console.error('Failed to retrieve order history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display font-black text-3xl uppercase tracking-wider mb-8">My Orders</h2>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === 'orders' ? 'border-brand-accentNeon text-white' : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <Package size={14} /> Order History
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === 'returns' ? 'border-brand-accentNeon text-white' : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            <RotateCcw size={14} /> Returns & Refunds
          </button>
        </div>

        {/* Order History Tab */}
        {activeTab === 'orders' && (
          <>
            {loading ? (
              <div className="animate-pulse flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-neutral-900 rounded-xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-4">No orders yet.</p>
                <a href="/shop" className="text-brand-accentNeon hover:underline text-xs font-bold uppercase tracking-widest">
                  Start Shopping <ArrowRight size={14} className="inline" />
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => setSelectedOrderId(order._id)}
                    className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-[10px] text-neutral-500 font-mono tracking-widest mb-1">ID: {order._id}</p>
                      <p className="text-sm font-bold text-white mb-2">Total: ₹{order.totalPrice.toFixed(2)}</p>
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : order.orderStatus === 'CANCELLED'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
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
          </>
        )}

        {/* Returns Tab */}
        {activeTab === 'returns' && <MyReturns />}
      </div>

      {selectedOrderId && <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}
    </div>
  );
}

