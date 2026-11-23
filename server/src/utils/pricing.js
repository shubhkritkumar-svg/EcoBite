export const PRICING = {
  deliveryFee: 25,
  freeDeliveryThreshold: 499,
  packagingFee: 10,
  taxRate: 0.05, // GST on restaurant service, simplified
};

const toRupees = (value) => Math.round(Number(value) || 0);

/**
 * Builds the authoritative bill from menu prices stored in MongoDB.
 * The client never supplies prices or totals.
 */
export function computeTotals(items) {
  const itemTotal = items.reduce((sum, item) => sum + toRupees(item.price) * item.quantity, 0);
  const deliveryFee = itemTotal >= PRICING.freeDeliveryThreshold ? 0 : PRICING.deliveryFee;
  const packagingFee = items.length ? PRICING.packagingFee : 0;
  const taxes = Math.round(itemTotal * PRICING.taxRate);
  const total = itemTotal + deliveryFee + packagingFee + taxes;

  return { itemTotal, deliveryFee, packagingFee, taxes, total };
}
