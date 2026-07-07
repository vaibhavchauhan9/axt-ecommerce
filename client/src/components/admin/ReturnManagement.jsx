import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import apiClient from '../../services/apiClient';

const inputClass =
  'w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-accentNeon transition-colors';

const statusBadgeClass = (status) => {
  if (status === 'REFUND_PROCESSED') return 'bg-emerald-500/10 text-emerald-400';
  if (['REJECTED', 'CANCELLED'].includes(status)) return 'bg-red-500/10 text-red-400';
  return 'bg-amber-500/10 text-amber-400';
};

export default function ReturnManagement() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Per-request transient form fields, keyed by return id
  const [pickupForms, setPickupForms] = useState({});
  const [inspectionForms, setInspectionForms] = useState({});
  const [refundForms, setRefundForms] = useState({});

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/returns', { params: statusFilter ? { status: statusFilter } : {} });
      setReturns(data.data.returns);
    } catch (err) {
      console.error('Failed to load returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id, payload) => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/returns/${id}/status`, payload);
      await fetchReturns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (id) => updateStatus(id, { status: 'APPROVED' });

  const handleReject = (id) => {
    const rejectionReason = window.prompt('Reason for rejecting this request:');
    if (!rejectionReason) return;
    updateStatus(id, { status: 'REJECTED', rejectionReason });
  };

  const handleSchedulePickup = (id) => {
    const form = pickupForms[id] || {};
    updateStatus(id, { status: 'PICKUP_SCHEDULED', pickupDate: form.date, pickupAddress: form.address });
  };

  const handleMarkReceived = (id) => {
    const form = inspectionForms[id] || {};
    updateStatus(id, { status: 'PRODUCT_RECEIVED', inspectionCondition: form.condition, restock: form.restock !== false });
  };

  const handleProcessRefund = async (r) => {
    setActionLoading(true);
    try {
      const form = refundForms[r._id] || {};
      await apiClient.post(`/returns/${r._id}/refund`, {
        amount: form.amount ? Number(form.amount) : undefined,
        method: form.method || 'ORIGINAL_PAYMENT_METHOD',
      });
      await fetchReturns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setActionLoading(false);
    }
  };

  const defaultRefundAmount = (r) => r.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-black text-lg uppercase tracking-wider flex items-center gap-2">
          <RotateCcw size={18} /> Returns, Replacements & Refunds
        </h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-neutral-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white rounded px-3 py-2 focus:outline-none focus:border-brand-accentNeon cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="REQUESTED">Requested</option>
          <option value="APPROVED">Approved</option>
          <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
          <option value="PRODUCT_RECEIVED">Product Received</option>
          <option value="REFUND_PROCESSED">Refund Processed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-neutral-900 rounded-xl" />)}
        </div>
      ) : returns.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-10">No requests match this filter.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {returns.map((r) => (
            <div key={r._id} className="glass-card border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setExpandedId(expandedId === r._id ? null : r._id)}>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white uppercase tracking-wide truncate">
                    {r.requestType} · {r.user?.name || 'Customer'} · {r.items.length} item(s)
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Order #{r.order?._id?.toString().slice(-8).toUpperCase()} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${statusBadgeClass(r.status)}`}>
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>

              {expandedId === r._id && (
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {r.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs text-neutral-300">
                        <img src={it.image} alt={it.name} className="w-8 h-8 object-cover rounded bg-neutral-800" />
                        <span>{it.quantity}x {it.name} ({it.size}/{it.color?.name}) — ₹{(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-500">Reason: <span className="text-neutral-300">{r.reason.replace(/_/g, ' ')}</span></p>
                  {r.description && <p className="text-[10px] text-neutral-500">Customer note: "{r.description}"</p>}
                  {r.images?.length > 0 && (
                    <div className="flex gap-2">
                      {r.images.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="evidence" className="w-12 h-12 object-cover rounded bg-neutral-800" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Actions per status */}
                  {r.status === 'REQUESTED' && (
                    <div className="flex gap-2">
                      <button disabled={actionLoading} onClick={() => handleApprove(r._id)} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 hover:bg-emerald-500/20 disabled:opacity-50">
                        Approve
                      </button>
                      <button disabled={actionLoading} onClick={() => handleReject(r._id)} className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 hover:bg-red-500/20 disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  )}

                  {r.status === 'APPROVED' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="date" onChange={(e) => setPickupForms({ ...pickupForms, [r._id]: { ...pickupForms[r._id], date: e.target.value } })} className={`${inputClass} w-40`} />
                      <input type="text" placeholder="Pickup address" onChange={(e) => setPickupForms({ ...pickupForms, [r._id]: { ...pickupForms[r._id], address: e.target.value } })} className={`${inputClass} flex-1 min-w-[160px]`} />
                      <button disabled={actionLoading} onClick={() => handleSchedulePickup(r._id)} className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 hover:bg-purple-500/20 disabled:opacity-50">
                        Schedule Pickup
                      </button>
                    </div>
                  )}

                  {r.status === 'PICKUP_SCHEDULED' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="text" placeholder="Inspection note (e.g. Sealed, unused)" onChange={(e) => setInspectionForms({ ...inspectionForms, [r._id]: { ...inspectionForms[r._id], condition: e.target.value } })} className={`${inputClass} flex-1 min-w-[200px]`} />
                      <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-widest">
                        <input type="checkbox" defaultChecked onChange={(e) => setInspectionForms({ ...inspectionForms, [r._id]: { ...inspectionForms[r._id], restock: e.target.checked } })} />
                        Restock
                      </label>
                      <button disabled={actionLoading} onClick={() => handleMarkReceived(r._id)} className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 hover:bg-blue-500/20 disabled:opacity-50">
                        Mark Product Received
                      </button>
                    </div>
                  )}

                  {r.status === 'PRODUCT_RECEIVED' && r.requestType !== 'REPLACEMENT' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        placeholder={`Amount (default ₹${defaultRefundAmount(r).toFixed(2)})`}
                        onChange={(e) => setRefundForms({ ...refundForms, [r._id]: { ...refundForms[r._id], amount: e.target.value } })}
                        className={`${inputClass} w-48`}
                      />
                      <select
                        onChange={(e) => setRefundForms({ ...refundForms, [r._id]: { ...refundForms[r._id], method: e.target.value } })}
                        className={`${inputClass} w-56 cursor-pointer`}
                        defaultValue="ORIGINAL_PAYMENT_METHOD"
                      >
                        <option value="ORIGINAL_PAYMENT_METHOD">Refund to Original Payment Method</option>
                        <option value="STORE_CREDIT">Issue Store Credit</option>
                        <option value="BANK_TRANSFER">Manual Bank Transfer</option>
                      </select>
                      <button disabled={actionLoading} onClick={() => handleProcessRefund(r)} className="bg-brand-accentNeon text-black text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-50">
                        Process Refund
                      </button>
                    </div>
                  )}

                  {r.status === 'PRODUCT_RECEIVED' && r.requestType === 'REPLACEMENT' && (
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                      Item received — create a new order for the replacement to fulfil it.
                    </p>
                  )}

                  {r.refund && (
                    <p className="text-[10px] text-neutral-500">
                      Refund: ₹{r.refund.amount?.toFixed?.(2) ?? r.refund.amount} · {r.refund.status} via {r.refund.gateway || r.refund.method}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
