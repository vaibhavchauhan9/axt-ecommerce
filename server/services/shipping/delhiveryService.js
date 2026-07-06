import { delhiveryConfig, pickupAddress } from '../../config/shipping.js';
import AppError from '../../utils/appError.js';

const request = async (path, options = {}) => {
  const res = await fetch(`${delhiveryConfig.baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Token ${delhiveryConfig.apiToken}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new AppError(`Delhivery API error (${res.status}): ${data?.error || 'Unknown error'}`, 502);
  }
  return data;
};

/** Fetches one fresh waybill (AWB) number from Delhivery's pool. */
const fetchWaybill = async () => {
  const data = await request(`/waybill/api/bulk/json/?count=1&cl=${pickupAddress.name}`);
  // Delhivery returns either a single string or an array depending on `count`.
  return Array.isArray(data) ? data[0] : data;
};

const buildShipmentPayload = (order, waybill) => ({
  shipments: [
    {
      waybill,
      order: order._id.toString(),
      name: order.user?.name || 'Customer',
      add: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      pin: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
      phone: order.user?.phoneNumber || '9999999999',
      payment_mode: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
      cod_amount: order.paymentMethod === 'COD' ? order.totalPrice : 0,
      total_amount: order.totalPrice,
      quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
      products_desc: order.items.map((i) => i.name).join(', ').slice(0, 200),
    },
  ],
  pickup_location: { name: pickupAddress.name },
});

const createShipment = async (order) => {
  if (!delhiveryConfig.isConfigured) {
    return {
      provider: 'DELHIVERY',
      simulated: true,
      awbCode: `DL${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
      courierName: 'Delhivery (Simulated — no API token configured)',
      courierTrackingUrl: null,
      providerOrderId: null,
      providerShipmentId: null,
      estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      raw: { note: 'DELHIVERY_API_TOKEN not set — using simulated response.' },
    };
  }

  const waybill = await fetchWaybill();
  const payload = buildShipmentPayload(order, waybill);

  const data = await request('/api/cmu/create.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`,
  });

  const packageResult = data?.packages?.[0] || {};

  return {
    provider: 'DELHIVERY',
    simulated: false,
    awbCode: packageResult.waybill || waybill,
    courierName: 'Delhivery',
    courierTrackingUrl: packageResult.waybill
      ? `https://www.delhivery.com/track/package/${packageResult.waybill}`
      : null,
    providerOrderId: order._id.toString(),
    providerShipmentId: packageResult.waybill || waybill,
    estimatedDeliveryDate: null, // Delhivery reports ETA via the tracking API, not at creation time
    raw: data,
  };
};

const trackShipment = async (awbCode) => {
  if (!delhiveryConfig.isConfigured || !awbCode) {
    return { simulated: true, currentStatus: null, checkpoints: [] };
  }

  const data = await request(`/api/v1/packages/json/?waybill=${awbCode}`);
  const shipment = data?.ShipmentData?.[0]?.Shipment || {};

  return {
    simulated: false,
    currentStatus: shipment.Status?.Status || null,
    checkpoints: shipment.Scans || [],
    raw: data,
  };
};

// Delhivery does not expose a separate branded PDF-label endpoint the way
// Shiprocket does — labels are generated client-side from shipment data, or
// via the packing-slip endpoint once a real account/contract is in place.
const generateLabel = async () => ({
  simulated: true,
  labelUrl: null,
  note: 'Delhivery label generation requires an active Delhivery business contract — wire up /api/p/packing_slip once available.',
});

const calculateRate = async ({ deliveryPincode, weight = 0.5, codAmount = 0 }) => {
  if (!delhiveryConfig.isConfigured) {
    const base = 35 + weight * 18 + (codAmount > 0 ? 20 : 0);
    return {
      simulated: true,
      provider: 'DELHIVERY',
      options: [{ courierName: 'Simulated Delhivery Surface', cost: Math.round(base), etaDays: 5 }],
    };
  }

  const query = new URLSearchParams({
    md: 'E',
    cgm: weight * 1000, // grams
    o_pin: pickupAddress.pincode,
    d_pin: deliveryPincode,
    ss: 'Delivered',
    pt: codAmount > 0 ? 'COD' : 'Pre-paid',
  });
  const data = await request(`/api/kinko/v1/invoice/charges/.json?${query.toString()}`);
  const quote = Array.isArray(data) ? data[0] : data;

  return {
    simulated: false,
    provider: 'DELHIVERY',
    options: [{ courierName: 'Delhivery', cost: quote?.total_amount || null, etaDays: null }],
  };
};

export default { createShipment, trackShipment, generateLabel, calculateRate };
