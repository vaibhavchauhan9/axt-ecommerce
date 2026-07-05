import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, X, Percent, IndianRupee } from 'lucide-react';
import apiClient from '../../services/apiClient';

const emptyForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minCartValue: '',
  maxDiscountAmount: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
};

function CouponFormModal({ initialData, onClose, onSaved }) {
  const isEditing = Boolean(initialData);
  const [form, setForm] = useState(
    initialData
      ? {
          code: initialData.code || '',
          discountType: initialData.discountType || 'percentage',
          discountValue: initialData.discountValue ?? '',
          minCartValue: initialData.minCartValue ?? '',
          maxDiscountAmount: initialData.maxDiscountAmount ?? '',
          expiresAt: initialData.expiresAt ? initialData.expiresAt.slice(0, 10) : '',
          usageLimit: initialData.usageLimit ?? '',
          isActive: initialData.isActive ?? true,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.code.trim() || !form.discountValue) {
      setError('Coupon code and discount value are required.');
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minCartValue: form.minCartValue ? Number(form.minCartValue) : 0,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      expiresAt: form.expiresAt || null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await apiClient.patch(`/admin/coupons/${initialData._id}`, payload);
      } else {
        await apiClient.post('/admin/coupons', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="glass-card border border-white/10 rounded-xl p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 className="font-display font-black text-xl uppercase tracking-wider mb-6 flex items-center gap-3">
          <Tag className="text-brand-accentNeon" size={20} />
          {isEditing ? 'Edit Coupon' : 'New Coupon'}
        </h3>

        {error && (
          <p className="text-red-400 text-xs mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
              Coupon Code
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                Discount Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) => handleChange('discountType', e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                Discount Value
              </label>
              <div className="relative">
                {form.discountType === 'percentage' ? (
                  <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                ) : (
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                )}
                <input
                  type="number"
                  min="0"
                  value={form.discountValue}
                  onChange={(e) => handleChange('discountValue', e.target.value)}
                  className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 pl-9 pr-4 focus:outline-none focus:border-brand-accentNeon"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                Min Cart Value
              </label>
              <input
                type="number"
                min="0"
                value={form.minCartValue}
                onChange={(e) => handleChange('minCartValue', e.target.value)}
                placeholder="0"
                className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
              />
            </div>
            {form.discountType === 'percentage' && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                  Max Discount Cap
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscountAmount}
                  onChange={(e) => handleChange('maxDiscountAmount', e.target.value)}
                  placeholder="No cap"
                  className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
                className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                Usage Limit
              </label>
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => handleChange('usageLimit', e.target.value)}
                placeholder="Unlimited"
                className="w-full bg-neutral-900/50 border border-white/10 text-white text-sm rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 accent-brand-accentNeon"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">Active</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/coupons');
      setCoupons(data.data.coupons);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreateForm = () => {
    setEditingCoupon(null);
    setShowForm(true);
  };

  const openEditForm = (coupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    setDeleteLoadingId(coupon._id);
    try {
      await apiClient.delete(`/admin/coupons/${coupon._id}`);
      await fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete coupon.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const formatDiscount = (coupon) =>
    coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`;

  const isExpired = (coupon) => coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
          <Tag className="text-brand-accentNeon" /> Coupon Management
        </h3>
        <button
          onClick={openCreateForm}
          className="btn-primary flex items-center justify-center gap-2 py-3 px-5 text-xs shrink-0"
        >
          <Plus size={14} /> New Coupon
        </button>
      </div>

      <div className="glass-card border border-white/5 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 bg-black/40">
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Code</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Discount</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Min Cart</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Usage</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Expires</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Status</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={7} className="p-4">
                    <div className="h-6 bg-neutral-900 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500 text-xs uppercase tracking-widest font-bold">
                  No coupons created yet.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const expired = isExpired(coupon);
                return (
                  <tr key={coupon._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-xs font-bold uppercase text-white">{coupon.code}</td>
                    <td className="p-4 text-xs text-brand-accentNeon font-bold">{formatDiscount(coupon)}</td>
                    <td className="p-4 text-xs text-neutral-300">₹{coupon.minCartValue || 0}</td>
                    <td className="p-4 text-xs text-neutral-300">
                      {coupon.usedCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td className="p-4 text-xs text-neutral-400">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${
                          !coupon.isActive
                            ? 'bg-neutral-500/10 text-neutral-400'
                            : expired
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {!coupon.isActive ? 'Disabled' : expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditForm(coupon)}
                          className="text-neutral-400 hover:text-white transition-colors"
                          aria-label="Edit coupon"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          disabled={deleteLoadingId === coupon._id}
                          className="text-neutral-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          aria-label="Delete coupon"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CouponFormModal
          initialData={editingCoupon}
          onClose={() => setShowForm(false)}
          onSaved={fetchCoupons}
        />
      )}
    </div>
  );
}

