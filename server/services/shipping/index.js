import shiprocketService from './shiprocketService.js';
import delhiveryService from './delhiveryService.js';
import { shiprocketConfig, delhiveryConfig, DEFAULT_PROVIDER } from '../../config/shipping.js';
import AppError from '../../utils/appError.js';

const PROVIDERS = {
  SHIPROCKET: shiprocketService,
  DELHIVERY: delhiveryService,
};

export const getProviderStatus = () => [
  { provider: 'SHIPROCKET', configured: shiprocketConfig.isConfigured },
  { provider: 'DELHIVERY', configured: delhiveryConfig.isConfigured },
];

const resolveProvider = (providerName) => {
  const name = (providerName || DEFAULT_PROVIDER || 'SHIPROCKET').toUpperCase();
  const adapter = PROVIDERS[name];
  if (!adapter) {
    throw new AppError(`Unknown shipping provider "${providerName}". Use SHIPROCKET or DELHIVERY.`, 400);
  }
  return { name, adapter };
};

/** Creates a shipment for an order via the requested (or default) courier partner. */
export const createShipment = async (order, providerName) => {
  const { name, adapter } = resolveProvider(providerName);
  const result = await adapter.createShipment(order);
  return { ...result, provider: name };
};

/** Pulls the latest courier status for an order's existing AWB. */
export const trackShipment = async (order) => {
  if (!order.tracking?.trackingNumber || !order.shipment?.provider) {
    throw new AppError('This order has no shipment/AWB to sync yet.', 400);
  }
  const { adapter } = resolveProvider(order.shipment.provider);
  return adapter.trackShipment(order.tracking.trackingNumber);
};

/** Generates a printable label for an order's existing shipment. */
export const generateLabel = async (order) => {
  if (!order.shipment?.provider) {
    throw new AppError('This order has no shipment created yet.', 400);
  }
  const { adapter } = resolveProvider(order.shipment.provider);
  return adapter.generateLabel(order.shipment.providerShipmentId);
};

/** Checks serviceability + estimated cost across a specific provider (or the default one). */
export const calculateRate = async (params, providerName) => {
  const { adapter } = resolveProvider(providerName);
  return adapter.calculateRate(params);
};

// Maps courier-reported statuses (which vary by provider and are inconsistently
// capitalized/worded) onto our own orderStatus pipeline, so a tracking sync can
// safely move an order forward automatically.
export const mapCourierStatusToOrderStatus = (currentStatus) => {
  if (!currentStatus) return null;
  const normalized = currentStatus.toLowerCase();

  if (normalized.includes('deliver') && !normalized.includes('out for')) return 'DELIVERED';
  if (normalized.includes('out for delivery')) return 'OUT_FOR_DELIVERY';
  if (normalized.includes('in transit') || normalized.includes('shipped') || normalized.includes('picked up')) {
    return 'SHIPPED';
  }
  if (normalized.includes('ready to ship') || normalized.includes('manifested')) return 'READY_TO_SHIP';
  if (normalized.includes('cancel') || normalized.includes('rto')) return 'CANCELLED';

  return null;
};
