import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Mail, Package, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient';

const FAQ_ITEMS = [
  {
    q: 'How long does shipping take?',
    a: 'Orders are usually dispatched within 1-2 business days and delivered within 4-7 business days depending on your location. You can track your order anytime from My Orders.',
  },
  {
    q: 'What is your return policy?',
    a: 'You can request a return, replacement, or refund within 7 days of delivery. Go to My Orders → open the delivered order → tap "Request Return / Replacement / Refund".',
  },
  {
    q: 'Do you offer Cash on Delivery?',
    a: 'Yes — Cash on Delivery is available at checkout alongside card and UPI payments.',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to My Orders, select the order you want to track, and you\'ll see a live status timeline (Pending → Packed → Shipped → Delivered).',
  },
  {
    q: 'Can I cancel or change my order after placing it?',
    a: 'Reach out to us via the form below with your Order ID as soon as possible — we can usually make changes before the order is packed for shipping.',
  },
  {
    q: 'What sizes do you offer?',
    a: 'Most products are available in XS through XXL. Exact sizes available for a given product are shown on its product page.',
  },
];

function FaqAccordionItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-bold text-white pr-4">{item.q}</span>
        <ChevronDown size={18} className={`text-brand-accentNeon shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-xs text-neutral-400 leading-relaxed pb-5 pr-8">{item.a}</p>}
    </div>
  );
}

export default function Support() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(''); // '', 'sending', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await apiClient.post('/contact', form);
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.response?.data?.message || 'Failed to send your message. Please try again.');
    }
  };

  const inputClass = 'w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon';

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-24 px-4 md:px-8 text-white">
      <div className="max-w-4xl mx-auto">

        <p className="text-[10px] text-brand-accentNeon font-bold uppercase tracking-[0.3em] mb-4 text-center">
          We're Here to Help
        </p>
        <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-wider text-center mb-12">
          Support
        </h1>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          <Link
            to="/orders"
            className="glass-card border border-white/5 p-6 flex items-center gap-4 hover:border-brand-accentNeon/40 transition-colors"
          >
            <Package className="text-brand-accentNeon shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest">Track an Order</p>
              <p className="text-[11px] text-neutral-500 mt-1">Check status, timeline, and invoice.</p>
            </div>
          </Link>
          <Link
            to="/orders"
            className="glass-card border border-white/5 p-6 flex items-center gap-4 hover:border-brand-accentNeon/40 transition-colors"
          >
            <RotateCcw className="text-brand-accentNeon shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold uppercase tracking-widest">Returns & Refunds</p>
              <p className="text-[11px] text-neutral-500 mt-1">Request or track a return.</p>
            </div>
          </Link>
        </div>

        {/* FAQ */}
        <h2 className="font-display font-black text-xl uppercase tracking-wider mb-2">Frequently Asked Questions</h2>
        <div className="glass-card border border-white/5 px-6 mb-16">
          {FAQ_ITEMS.map((item, idx) => (
            <FaqAccordionItem key={idx} item={item} />
          ))}
        </div>

        {/* Contact Form */}
        <h2 className="font-display font-black text-xl uppercase tracking-wider mb-2 flex items-center gap-3">
          <Mail className="text-brand-accentNeon" size={20} /> Still need help?
        </h2>
        <p className="text-xs text-neutral-500 mb-6">Send us a message and we'll get back to you as soon as possible.</p>

        <form onSubmit={handleSubmit} className="glass-card border border-white/5 p-6 md:p-8 flex flex-col gap-5 max-w-xl">
          {status === 'success' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={14} /> Your message has been sent — we'll get back to you soon.
            </div>
          )}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
            <input
              type="email"
              required
              placeholder="Your Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <input
            type="text"
            placeholder="Subject (e.g. Order #12345 issue)"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className={inputClass}
          />
          <textarea
            required
            rows={5}
            placeholder="How can we help?"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn-primary py-3 disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>
        </form>

      </div>
    </div>
  );
}

