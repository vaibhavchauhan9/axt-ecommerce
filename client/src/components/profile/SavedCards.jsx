import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Pencil, Trash2, Star, X } from 'lucide-react';
import apiClient from '../../services/apiClient';

const emptyForm = { cardHolderName: '', cardNumber: '', expiryMonth: '', expiryYear: '', isDefault: false };

const brandBadge = {
  Visa: 'bg-blue-500/10 text-blue-400',
  Mastercard: 'bg-orange-500/10 text-orange-400',
  Amex: 'bg-sky-500/10 text-sky-400',
  RuPay: 'bg-purple-500/10 text-purple-400',
  Other: 'bg-neutral-500/10 text-neutral-400',
};

export default function SavedCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/users/cards');
      setCards(data.data.cards);
    } catch (error) {
      console.error('Failed to retrieve saved cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setStatus('');
    setShowForm(true);
  };

  const openEditForm = (card) => {
    setForm({
      cardHolderName: card.cardHolderName,
      cardNumber: '',
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      isDefault: card.isDefault,
    });
    setEditingId(card._id);
    setStatus('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      if (editingId) {
        // Editing never touches the card number — only name/expiry/default can change
        const { cardNumber, ...updatePayload } = form;
        const { data } = await apiClient.patch(`/users/cards/${editingId}`, updatePayload);
        setCards(data.data.cards);
      } else {
        const { data } = await apiClient.post('/users/cards', form);
        setCards(data.data.cards);
      }
      setShowForm(false);
      setStatus('');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to save card.');
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('Remove this saved card?')) return;
    try {
      const { data } = await apiClient.delete(`/users/cards/${cardId}`);
      setCards(data.data.cards);
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const handleSetDefault = async (card) => {
    try {
      const { data } = await apiClient.patch(`/users/cards/${card._id}`, { isDefault: true });
      setCards(data.data.cards);
    } catch (error) {
      console.error('Failed to set default card:', error);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 15 }, (_, i) => currentYear + i);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
          <CreditCard className="text-brand-accentNeon" /> Saved Cards
        </h3>
        <button onClick={openAddForm} className="btn-primary flex items-center gap-2 py-2 px-4 text-xs">
          <Plus size={14} /> Add Card
        </button>
      </div>

      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-6">
        For your security, we only store your card brand and last 4 digits. Full card details are never saved.
      </p>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-4">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-neutral-900 rounded-xl" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No saved cards yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div
              key={card._id}
              className={`bg-neutral-900/40 border rounded-xl p-5 relative transition-colors ${
                card.isDefault ? 'border-brand-accentNeon' : 'border-white/5 hover:border-white/20'
              }`}
            >
              {card.isDefault && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-accentNeon">
                  <Star size={12} className="fill-brand-accentNeon" /> Default
                </span>
              )}

              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-3 ${brandBadge[card.brand] || brandBadge.Other}`}>
                {card.brand}
              </span>

              <p className="text-sm font-bold text-white mb-1 font-mono tracking-widest">
                •••• •••• •••• {card.last4}
              </p>
              <p className="text-xs text-neutral-400">{card.cardHolderName}</p>
              <p className="text-xs text-neutral-400 mb-4">
                Expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
              </p>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => openEditForm(card)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(card._id)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card)}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-accentNeon transition-colors ml-auto"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="glass-card border border-white/10 rounded-xl p-6 md:p-8 w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h4 className="font-display font-black text-lg uppercase tracking-wider mb-6">
              {editingId ? 'Edit Card' : 'Add New Card'}
            </h4>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">
                  Cardholder Name
                </label>
                <input
                  required
                  type="text"
                  value={form.cardHolderName}
                  onChange={(e) => setForm({ ...form, cardHolderName: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">
                    Card Number
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="•••• •••• •••• ••••"
                    value={form.cardNumber}
                    onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon font-mono"
                  />
                  <p className="text-[9px] text-neutral-600 uppercase tracking-widest mt-1">
                    Only the brand and last 4 digits will be saved.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">
                    Expiry Month
                  </label>
                  <select
                    required
                    value={form.expiryMonth}
                    onChange={(e) => setForm({ ...form, expiryMonth: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  >
                    <option value="" disabled>MM</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">
                    Expiry Year
                  </label>
                  <select
                    required
                    value={form.expiryYear}
                    onChange={(e) => setForm({ ...form, expiryYear: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  >
                    <option value="" disabled>YYYY</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="accent-brand-accentNeon w-4 h-4"
                />
                <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Set as default card</span>
              </label>

              <button type="submit" className="btn-primary py-3 mt-2">
                {editingId ? 'Save Changes' : 'Add Card'}
              </button>

              {status && (
                <p className="text-xs text-center font-bold tracking-widest uppercase text-red-400">{status}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

