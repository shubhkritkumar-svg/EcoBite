// This mirrors server/src/utils/eco.js so the checkout screen can preview
// savings instantly. The server recalculates and stores the final numbers.

export const ECO_ASSUMPTIONS = {
  petrolTwoWheelerKgPerKm: 0.05,
  electricScooterKgPerKm: 0.025,
  packagingKg: { standard: 0.06, compostable: 0.025, reusable: 0.01 },
  cutleryKg: 0.012,
};

const round = (value) => Math.round(value * 1000) / 1000;

export function previewEcoImpact({ distanceKm = 2.5, deliveryMode = 'standard', packaging = 'standard', cutlery = true }) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const baselineDelivery = km * ECO_ASSUMPTIONS.petrolTwoWheelerKgPerKm;
  const actualDelivery =
    deliveryMode === 'bicycle'
      ? 0
      : deliveryMode === 'ev'
        ? km * ECO_ASSUMPTIONS.electricScooterKgPerKm
        : baselineDelivery;

  const baselinePackaging = ECO_ASSUMPTIONS.packagingKg.standard;
  const actualPackaging = ECO_ASSUMPTIONS.packagingKg[packaging] ?? baselinePackaging;
  const actualCutlery = cutlery ? ECO_ASSUMPTIONS.cutleryKg : 0;

  const co2SavedKg = round(
    Math.max(
      0,
      baselineDelivery + baselinePackaging + ECO_ASSUMPTIONS.cutleryKg - actualDelivery - actualPackaging - actualCutlery
    )
  );

  const greenPoints =
    (deliveryMode === 'ev' || deliveryMode === 'bicycle' ? 10 : 0) +
    (packaging !== 'standard' ? 10 : 0) +
    (!cutlery ? 5 : 0);

  return {
    co2SavedKg,
    greenPoints,
    baselineCo2Kg: round(baselineDelivery + baselinePackaging + ECO_ASSUMPTIONS.cutleryKg),
    actualCo2Kg: round(actualDelivery + actualPackaging + actualCutlery),
  };
}

export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_FEE = 25;
export const PACKAGING_FEE = 10;
export const TAX_RATE = 0.05;

export function previewTotals(items) {
  const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const packagingFee = items.length ? PACKAGING_FEE : 0;
  const taxes = Math.round(itemTotal * TAX_RATE);
  return {
    itemTotal,
    deliveryFee,
    packagingFee,
    taxes,
    total: itemTotal + deliveryFee + packagingFee + taxes,
  };
}
