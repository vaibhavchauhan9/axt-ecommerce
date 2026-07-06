import React from 'react';
import { Check, Truck, Phone, CalendarClock, Hash } from 'lucide-react';

// Canonical forward pipeline shown to customers. Mirrors ORDER_STATUS_SEQUENCE
// on the server (server/models/Order.js).
export const STATUS_STEPS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'READY_TO_SHIP', label: 'Ready To Ship' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const findHistoryEntry = (statusHistory, statusKey) =>
  (statusHistory || []).find((h) => h.status === statusKey);

/**
 * Renders the live order tracking timeline: a horizontal step tracker for the
 * pipeline, plus courier / tracking-number / ETA details when available.
 * Used on the customer Profile "Order Tracking" tab and the Order Details modal.
 */
export default function OrderTimeline({ order }) {
  if (!order) return null;

  const isCancelled = order.orderStatus === 'CANCELLED';
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.orderStatus);
  const tracking = order.tracking || {};

  return (
    <div>
      {isCancelled ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-red-400">Order Cancelled</p>
          {findHistoryEntry(order.statusHistory, 'CANCELLED')?.updatedAt && (
            <p className="text-[10px] text-neutral-500 mt-1">
              {new Date(findHistoryEntry(order.statusHistory, 'CANCELLED').updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 overflow-x-auto">
          <div className="flex items-start justify-between min-w-[640px] px-1">
            {STATUS_STEPS.map((step, idx) => {
              const reached = idx <= currentStepIndex;
              const historyEntry = findHistoryEntry(order.statusHistory, step.key);
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-2 w-24 text-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                        reached
                          ? 'bg-brand-accentNeon border-brand-accentNeon text-black'
                          : 'bg-neutral-900 border-white/10 text-neutral-600'
                      }`}
                    >
                      {reached && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest leading-tight ${reached ? 'text-white' : 'text-neutral-600'}`}>
                      {step.label}
                    </span>
                    {historyEntry?.updatedAt && (
                      <span className="text-[8px] text-neutral-500">
                        {new Date(historyEntry.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mt-3 ${idx < currentStepIndex ? 'bg-brand-accentNeon' : 'bg-neutral-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Shipment / courier details — only shown once a tracking number exists */}
      {(tracking.trackingNumber || tracking.courierName || tracking.estimatedDeliveryDate) && (
        <div className="bg-neutral-900/40 border border-white/5 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tracking.trackingNumber && (
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Hash size={13} className="text-brand-accentNeon shrink-0" />
              <span className="text-neutral-500">Tracking No.</span>
              <span className="font-mono font-bold text-white">{tracking.trackingNumber}</span>
            </div>
          )}
          {tracking.courierName && (
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Truck size={13} className="text-brand-accentNeon shrink-0" />
              <span className="text-neutral-500">Courier</span>
              <span className="font-bold text-white">{tracking.courierName}</span>
            </div>
          )}
          {tracking.courierPhone && (
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Phone size={13} className="text-brand-accentNeon shrink-0" />
              <span className="text-neutral-500">Courier Phone</span>
              <span className="font-bold text-white">{tracking.courierPhone}</span>
            </div>
          )}
          {tracking.estimatedDeliveryDate && (
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <CalendarClock size={13} className="text-brand-accentNeon shrink-0" />
              <span className="text-neutral-500">Est. Delivery</span>
              <span className="font-bold text-white">
                {new Date(tracking.estimatedDeliveryDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
          {tracking.courierTrackingUrl && (
            <a
              href={tracking.courierTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold uppercase tracking-widest text-brand-accentNeon hover:underline sm:col-span-2"
            >
              Track on courier site →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
