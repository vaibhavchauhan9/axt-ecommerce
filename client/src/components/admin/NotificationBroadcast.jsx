import React, { useState, useRef, useEffect } from 'react';
import { Bell, Send, Users, User as UserIcon, X, Loader2 } from 'lucide-react';
import apiClient from '../../services/apiClient';

const typeOptions = [
  { value: 'PROMO', label: 'Promotion' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'ORDER', label: 'Order' },
];

export default function NotificationBroadcast() {
  const [target, setTarget] = useState('all'); // 'all' | 'single'
  const [form, setForm] = useState({ title: '', message: '', type: 'PROMO', link: '' });
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }
  const debounceRef = useRef(null);

  useEffect(() => {
    if (target !== 'single') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (customerQuery.trim().length < 2) {
      setCustomerResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await apiClient.get('/admin/customers', { params: { search: customerQuery, limit: 8 } });
        setCustomerResults(data.data.customers);
      } catch (error) {
        console.error('Customer search failed:', error);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [customerQuery, target]);

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!form.title.trim() || !form.message.trim()) {
      setStatus({ type: 'error', message: 'Title and message are required.' });
      return;
    }
    if (target === 'single' && !selectedCustomer) {
      setStatus({ type: 'error', message: 'Please select a customer to notify.' });
      return;
    }

    setSending(true);
    try {
      const { data } = await apiClient.post('/admin/notifications', {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        link: form.link.trim() || undefined,
        target,
        userId: target === 'single' ? selectedCustomer._id : undefined,
      });
      setStatus({ type: 'success', message: data.message });
      setForm({ title: '', message: '', type: 'PROMO', link: '' });
      setSelectedCustomer(null);
      setCustomerQuery('');
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send notification.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
        <Bell className="text-brand-accentNeon" /> Send Notification
      </h3>

      <div className="glass-card border border-white/5 p-6 md:p-8">
        <form onSubmit={handleSend} className="flex flex-col gap-5">

          {/* Recipient toggle */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Send To</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setTarget('all'); setSelectedCustomer(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${
                  target === 'all' ? 'bg-brand-accentNeon/10 border-brand-accentNeon text-white' : 'bg-neutral-900/50 border-white/10 text-neutral-400 hover:border-white/30'
                }`}
              >
                <Users size={14} /> All Customers
              </button>
              <button
                type="button"
                onClick={() => setTarget('single')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors ${
                  target === 'single' ? 'bg-brand-accentNeon/10 border-brand-accentNeon text-white' : 'bg-neutral-900/50 border-white/10 text-neutral-400 hover:border-white/30'
                }`}
              >
                <UserIcon size={14} /> Specific Customer
              </button>
            </div>
          </div>

          {/* Customer search (only when target === single) */}
          {target === 'single' && (
            <div className="relative">
              <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Customer</label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-white/5 border border-brand-accentNeon/30 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-white">{selectedCustomer.name}</p>
                    <p className="text-[10px] text-neutral-400">{selectedCustomer.email}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="text-neutral-400 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  />
                  {searching && (
                    <Loader2 size={14} className="absolute right-3 top-11 text-neutral-500 animate-spin" />
                  )}
                  {customerResults.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-lg overflow-hidden shadow-xl max-h-52 overflow-y-auto">
                      {customerResults.map((customer) => (
                        <button
                          key={customer._id}
                          type="button"
                          onClick={() => { setSelectedCustomer(customer); setCustomerResults([]); }}
                          className="w-full text-left px-4 py-3 text-xs hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          <p className="font-bold text-white">{customer.name}</p>
                          <p className="text-[10px] text-neutral-400">{customer.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Notification Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Flash Sale This Weekend!"
              className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Message</label>
            <textarea
              required
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write the notification message..."
              className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Link (optional)</label>
            <input
              type="text"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="/shop or /product/some-slug"
              className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
            />
          </div>

          {status && (
            <p className={`text-xs font-bold ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={14} />
            {sending ? 'Sending...' : target === 'all' ? 'Broadcast to All Customers' : 'Send to Customer'}
          </button>
        </form>
      </div>
    </div>
  );
}

