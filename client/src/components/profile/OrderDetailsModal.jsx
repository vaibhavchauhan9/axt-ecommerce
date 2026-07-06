import React, { useState, useEffect } from 'react';
import { X, MapPin, CreditCard, Package } from 'lucide-react';
import apiClient from '../../services/apiClient';
import OrderTimeline from './OrderTimeline';

const statusColor = (status) => {
  if (status === 'DELIVERED') return 'text-emerald-400 bg-emerald-500/10';
  if (status === 'CANCELLED') return 'text-red-400 bg-red-500/10';
  return 'text-amber-400 bg-amber-500/10';
};

export default function OrderDetailsModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let pollTimer;

    const fetchOrder = async (isInitial) => {
      if (isInitial) setLoading(true);
      try {
        const { data } = await apiClient.get(`/orders/${orderId}`);
        setOrder(data.data.order);
      } catch (err) {
        if (isInitial) setError(err.response?.data?.message || 'Failed to load order details.');
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder(true);
      // Lightweight "real-time" tracking: re-check status every 20s while
      // the modal is open, so a customer watching their order sees updates
      // (e.g. admin marking it Shipped) without needing to close/reopen.
      pollTimer = setInterval(() => fetchOrder(false), 20000);
    }

    return () => clearInterval(pollTimer);
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="glass-card border border-white/10 rounded-xl p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="animate-pulse flex flex-col gap-4 py-8">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-neutral-900 rounded-xl" />)}
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-12">{error}</p>
        ) : order ? (
          <>
            <div className="mb-6">
              <p className="text-[10px] text-neutral-500 font-mono tracking-widest mb-1">
                ORDER ID: {order._id}
              </p>
              <div className="flex items-center gap-3">
                <h3 className="font-display font-black text-xl uppercase tracking-wider">Order Details</h3>
                <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${statusColor(order.orderStatus)}`}>
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Live Status Timeline + Courier / Tracking Details */}
            <OrderTimeline order={order} />

            {/* Items */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                <Package size={14} /> Items
              </h4>
              <div className="flex flex-col gap-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-neutral-900/40 border border-white/5 rounded-lg p-3">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-md bg-neutral-800" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {item.size} / {item.color} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-white shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                <MapPin size={14} /> Shipping Address
              </h4>
              <div className="bg-neutral-900/40 border border-white/5 rounded-lg p-4 text-xs text-neutral-300">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-2">
                <CreditCard size={14} /> Payment Summary
              </h4>
              <div className="bg-neutral-900/40 border border-white/5 rounded-lg p-4 text-xs text-neutral-300 flex flex-col gap-2">
                <div className="flex justify-between"><span>Method</span><span>{order.paymentMethod}</span></div>
                <div className="flex justify-between"><span>Items</span><span>₹{order.itemsPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>₹{order.taxPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice.toFixed(2)}`}</span></div>
                <div className="flex justify-between pt-2 border-t border-white/5 font-bold text-white">
                  <span>Total</span><span>₹{order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
