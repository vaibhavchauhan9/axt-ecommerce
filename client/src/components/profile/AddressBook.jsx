import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star, X } from 'lucide-react';
import apiClient from '../../services/apiClient';

const emptyForm = { street: '', city: '', state: '', postalCode: '', country: '', isDefault: false };

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new, otherwise the address _id being edited
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/users/address');
      setAddresses(data.data.addresses);
    } catch (error) {
      console.error('Failed to retrieve saved addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (address) => {
    setForm({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      if (editingId) {
        const { data } = await apiClient.patch(`/users/address/${editingId}`, form);
        setAddresses(data.data.addresses);
      } else {
        const { data } = await apiClient.post('/users/address', form);
        setAddresses(data.data.addresses);
      }
      setShowForm(false);
      setStatus('');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to save address.');
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Remove this saved address?')) return;
    try {
      const { data } = await apiClient.delete(`/users/address/${addressId}`);
      setAddresses(data.data.addresses);
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  const handleSetDefault = async (address) => {
    try {
      const { data } = await apiClient.patch(`/users/address/${address._id}`, { ...address, isDefault: true });
      setAddresses(data.data.addresses);
    } catch (error) {
      console.error('Failed to set default address:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
          <MapPin className="text-brand-accentNeon" /> Saved Addresses
        </h3>
        <button
          onClick={openAddForm}
          className="btn-primary flex items-center gap-2 py-2 px-4 text-xs"
        >
          <Plus size={14} /> Add Address
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-4">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-neutral-900 rounded-xl" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-neutral-900/40 border rounded-xl p-5 relative transition-colors ${
                address.isDefault ? 'border-brand-accentNeon' : 'border-white/5 hover:border-white/20'
              }`}
            >
              {address.isDefault && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-accentNeon">
                  <Star size={12} className="fill-brand-accentNeon" /> Default
                </span>
              )}
              <p className="text-sm font-bold text-white mb-1">{address.street}</p>
              <p className="text-xs text-neutral-400">
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p className="text-xs text-neutral-400 mb-4">{address.country}</p>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                <button
                  onClick={() => openEditForm(address)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(address._id)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address)}
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
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h4>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Street Address</label>
                <input
                  required
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">City</label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">State</label>
                  <input
                    required
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Postal Code</label>
                  <input
                    required
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Country</label>
                  <input
                    required
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="accent-brand-accentNeon w-4 h-4"
                />
                <span className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Set as default address</span>
              </label>

              <button type="submit" className="btn-primary py-3 mt-2">
                {editingId ? 'Save Changes' : 'Add Address'}
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
