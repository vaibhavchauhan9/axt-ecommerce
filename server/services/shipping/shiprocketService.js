import { shiprocketConfig, pickupAddress } from '../../config/shipping.js';
import AppError from '../../utils/appError.js';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

const request = async (path, options = {}) => {
  const res = await fetch(`${shiprocketConfig.baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AppError(
      `Shiprocket API error (${res.status}): ${data?.message || 'Unknown error'}`,
      502
    );
  }
  return data;
};

// Shiprocket tokens are valid for ~240 hours; cache in-process and refresh
// a little early to avoid edge-of-expiry failures.
const getToken = async () => {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: shiprocketConfig.email, password: shiprocketConfig.password }),
  });

  cachedToken = data.token;
  cachedTokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000; // refresh daily
  return cachedToken;
};

const authedRequest = async (path, options = {}) => {
  const token = await getToken();
  return request(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
};

// Builds the payload Shiprocket's adhoc order-create endpoint expects.
const buildOrderPayload = (order) => ({
  order_id: order._id.toString(),
  order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' '),
  pickup_location: shiprocketConfig.pickupLocationName,
  billing_customer_name: order.user?.name || 'Customer',
  billing_last_name: '',
  billing_address: order.shippingAddress.street,
  billing_city: order.shippingAddress.city,
  billing_pincode: order.shippingAddress.postalCode,
  billing_state: order.shippingAddress.state,
  billing_country: order.shippingAddress.country,
  billing_email: order.user?.email || 'customer@example.com',
  billing_phone: order.user?.phoneNumber || '9999999999',
  shipping_is_billing: true,
  order_items: order.items.map((item) => ({
    name: item.name,
    sku: item.product?.toString().slice(-10) || 'SKU',
    units: item.quantity,
    selling_price: item.price,
  })),
  payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
  sub_total: order.itemsPrice,
  // Reasonable apparel-parcel defaults — override per-order once real product
  // dimensions/weights are tracked (see Feature 5: Inventory Management).
  length: 20,
  breadth: 15,
  height: 3,
  weight: Math.max(order.items.reduce((sum, i) => sum + i.quantity, 0) * 0.25, 0.3),
});

/**
 * Creates a shipment for an order: order → shipment → AWB assignment.
 * Returns a normalized shape used by the shipping controller regardless of
 * which provider was used.
 */
const createShipment = async (order) => {
  if (!shiprocketConfig.isConfigured) {
    return {
      provider: 'SHIPROCKET',
      simulated: true,
      awbCode: `SR${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
      courierName: 'Shiprocket (Simulated — no credentials configured)',
      courierTrackingUrl: null,
      providerOrderId: null,
      providerShipmentId: null,
      estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      raw: { note: 'SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD not set — using simulated response.' },
    };
  }

  const created = await authedRequest('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(buildOrderPayload(order)),
  });

  const shipmentId = created.shipment_id;
  const providerOrderId = created.order_id;

  // Auto-assign the best available courier (Shiprocket picks by recommendation
  // when no courier_id is passed).
  const awbResult = await authedRequest('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentId }),
  });

  const response = awbResult.response?.data || {};

  return {
    provider: 'SHIPROCKET',
    simulated: false,
    awbCode: response.awb_code || null,
    courierName: response.courier_name || 'Shiprocket Courier',
    courierTrackingUrl: response.awb_code
      ? `https://shiprocket.co/tracking/${response.awb_code}`
      : null,
    providerOrderId,
    providerShipmentId: shipmentId,
    estimatedDeliveryDate: response.expected_delivery_date
      ? new Date(response.expected_delivery_date)
      : null,
    raw: created,
  };
};

/** Syncs current courier status for an existing AWB. */
const trackShipment = async (awbCode) => {
  if (!shiprocketConfig.isConfigured || !awbCode) {
    return { simulated: true, currentStatus: null, checkpoints: [] };
  }

  const data = await authedRequest(`/courier/track/awb/${awbCode}`);
  const trackingData = data?.tracking_data || {};

  return {
    simulated: false,
    currentStatus: trackingData.shipment_track?.[0]?.current_status || null,
    checkpoints: trackingData.shipment_track_activities || [],
    raw: data,
  };
};

/** Generates a printable shipping label PDF URL for an existing shipment. */
const generateLabel = async (providerShipmentId) => {
  if (!shiprocketConfig.isConfigured || !providerShipmentId) {
    return { simulated: true, labelUrl: null };
  }
  const data = await authedRequest('/courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [providerShipmentId] }),
  });
  return { simulated: false, labelUrl: data.label_url || null, raw: data };
};

/** Checks serviceability + estimated cost for a delivery pincode. */
const calculateRate = async ({ deliveryPincode, weight = 0.5, codAmount = 0 }) => {
  if (!shiprocketConfig.isConfigured) {
    // Simple simulated flat-rate estimate so the admin rate-check UI still works.
    const base = 40 + weight * 20 + (codAmount > 0 ? 25 : 0);
    return {
      simulated: true,
      provider: 'SHIPROCKET',
      options: [{ courierName: 'Simulated Standard', cost: Math.round(base), etaDays: 4 }],
    };
  }

  const query = new URLSearchParams({
    pickup_postcode: pickupAddress.pincode,
    delivery_postcode: deliveryPincode,
    weight,
    cod: codAmount > 0 ? 1 : 0,
  });
  const data = await authedRequest(`/courier/serviceability?${query.toString()}`);
  const options = (data?.data?.available_courier_companies || []).map((c) => ({
    courierName: c.courier_name,
    cost: c.rate,
    etaDays: c.estimated_delivery_days,
  }));

  return { simulated: false, provider: 'SHIPROCKET', options };
};

export default { createShipment, trackShipment, generateLabel, calculateRate };
