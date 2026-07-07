import React, { useState } from 'react';
import { X } from 'lucide-react';
import apiClient from '../../services/apiClient';

const REASONS = [
  { value: 'DAMAGED_OR_DEFECTIVE', label: 'Damaged or defective' },
  { value: 'WRONG_ITEM_RECEIVED', label: 'Wrong item received' },
  { value: 'SIZE_FIT_ISSUE', label: 'Size / fit issue' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'ITEM_NEVER_ARRIVED', label: 'Item never arrived' },
  { value: 'CHANGED_MIND', label: 'Changed my mind' },
  { value: 'OTHER', label: 'Other' },
];

const inputClass =
  'w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-accentNeon transition-colors';

export default function ReturnRequestModal({ order, onClose, onSubmitted }) {
  const [requestType, setRequestType] = useState('RETURN');
  const [reason, setReason] = useState('DAMAGED_OR_DEFECTIVE');
  const [description, setDescription] = useState('');
  const [imagesText, setImagesText] = useState('');
  // Map of "productId_size_color" -> quantity selected for this request (0 = not selected)
  const [selectedQty, setSelectedQty] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const itemKey = (item) => `${item.product}_${item.size}_${item.color?.name}`;

  const setQty = (item, qty) => {
    const clamped = Math.max(0, Math.min(qty, item.quantity));
    setSelectedQty({ ...selectedQty, [itemKey(item)]: clamped });
  };

  const handleSubmit = async () => {
    setError('');
    const items = order.items
      .filter((item) => (selectedQty[itemKey(item)] || 0) > 0)
      .map((item) => ({
        productId: item.product,
        size: item.size,
        color: item.color,
        quantity: selectedQty[itemKey(item)],
      }));

    if (items.length === 0) {
      setError('Select at least one item and quantity.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/returns', {
        orderId: order._id,
        requestType,
        reason,
        description,
        images: imagesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        items,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="glass-card border border-white/10 rounded-xl p-6 md:p-8 w-full max-w-xl max-h-[85vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 className="font-display font-black text-xl uppercase tracking-wider mb-1">Return / Replacement / Refund</h3>
        <p className="text-xs text-neutral-500 mb-6">
          Order #{order._id.toString().slice(-8).toUpperCase()}
        </p>

        {/* Request type */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['RETURN', 'REPLACEMENT', 'REFUND'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRequestType(type)}
              className={`text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-3 border transition-colors ${
                requestType === type
                  ? 'bg-brand-accentNeon text-black border-brand-accentNeon'
                  : 'bg-neutral-900 text-neutral-400 border-white/10 hover:border-white/20'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Items selection */}
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Select items</p>
        <div className="flex flex-col gap-2 mb-4">
          {order.items.map((item, idx) => {
            const qty = selectedQty[itemKey(item)] || 0;
            return (
              <div key={idx} className="flex items-center gap-3 bg-neutral-900/40 border border-white/5 rounded-lg p-3">
                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md bg-neutral-800 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-neutral-500">{item.size} / {item.color?.name} · ordered {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => setQty(item, qty - 1)} className="w-6 h-6 rounded bg-neutral-800 text-white text-xs">−</button>
                  <span className="w-5 text-center text-xs text-white">{qty}</span>
                  <button type="button" onClick={() => setQty(item, qty + 1)} className="w-6 h-6 rounded bg-neutral-800 text-white text-xs">+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reason */}
        <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputClass} mb-4 cursor-pointer`}>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <textarea
          placeholder="Describe the issue (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${inputClass} mb-4 resize-none`}
        />

        <input
          type="text"
          placeholder="Evidence photo URLs, comma-separated (optional)"
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          className={`${inputClass} mb-4`}
        />

        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="w-full bg-brand-accentNeon text-black text-xs font-black uppercase tracking-widest rounded-lg py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}
