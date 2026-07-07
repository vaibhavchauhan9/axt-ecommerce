import React, { useState, useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import apiClient from '../../services/apiClient';

const STATUS_STEPS = ['REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'PRODUCT_RECEIVED', 'REFUND_PROCESSED'];

const statusBadgeClass = (status) => {
  if (status === 'REFUND_PROCESSED') return 'bg-emerald-500/10 text-emerald-400';
  if (['REJECTED', 'CANCELLED'].includes(status)) return 'bg-red-500/10 text-red-400';
  return 'bg-amber-500/10 text-amber-400';
};

export default function MyReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/returns/my');
      setReturns(data.data.returns);
    } catch (err) {
      console.error('Failed to load return requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Withdraw this request?')) return;
    try {
      await apiClient.patch(`/returns/${id}/cancel`);
      fetchReturns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        {[1, 2].map((i) => <div key={i} className="h-20 bg-neutral-900 rounded-xl" />)}
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="glass-card p-10 border border-white/5 text-center">
        <RotateCcw size={28} className="mx-auto mb-3 text-neutral-600" />
        <p className="text-sm text-neutral-400">No return, replacement, or refund requests yet.</p>
        <p className="text-xs text-neutral-600 mt-1">You can start one from a delivered order's details.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {returns.map((r) => (
        <div key={r._id} className="glass-card border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setExpandedId(expandedId === r._id ? null : r._id)}>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white uppercase tracking-wide truncate">{r.requestType} · {r.items.length} item(s)</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`shrink-0 px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${statusBadgeClass(r.status)}`}>
              {r.status.replace(/_/g, ' ')}
            </span>
          </div>

          {expandedId === r._id && (
            <div className="mt-4 pt-4 border-t border-white/5">
              {/* mini progress steps */}
              {!['REJECTED', 'CANCELLED'].includes(r.status) && (
                <div className="flex items-center gap-1 mb-4 overflow-x-auto">
                  {STATUS_STEPS.map((step, idx) => (
                    <React.Fragment key={step}>
                      <span
                        className={`text-[8px] font-bold uppercase tracking-widest whitespace-nowrap px-2 py-1 rounded ${
                          idx <= STATUS_STEPS.indexOf(r.status) ? 'bg-brand-accentNeon/20 text-brand-accentNeon' : 'bg-neutral-900 text-neutral-600'
                        }`}
                      >
                        {step.replace(/_/g, ' ')}
                      </span>
                      {idx < STATUS_STEPS.length - 1 && <span className="text-neutral-700 text-[8px]">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {r.status === 'REJECTED' && r.rejectionReason && (
                <p className="text-xs text-red-400 mb-3">Rejected: {r.rejectionReason}</p>
              )}

              <div className="flex flex-col gap-2 mb-3">
                {r.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-neutral-300">
                    <img src={it.image} alt={it.name} className="w-8 h-8 object-cover rounded bg-neutral-800" />
                    <span>{it.quantity}x {it.name} ({it.size}/{it.color?.name})</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-neutral-500 mb-1">Reason: <span className="text-neutral-300">{r.reason.replace(/_/g, ' ')}</span></p>
              {r.description && <p className="text-[10px] text-neutral-500 mb-3">"{r.description}"</p>}

              {r.status === 'REQUESTED' && (
                <button
                  type="button"
                  onClick={() => handleCancel(r._id)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:underline"
                >
                  <X size={12} /> Withdraw Request
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
