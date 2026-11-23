/**
 * Eco impact model for EcoBite.
 *
 * These are deliberately simple, documented estimates - not a life-cycle
 * assessment. They are used to compare choices on the same order, which is
 * what the UI promises. Sources for the assumptions are listed in
 * docs/API.md and the README.
 */

export const ECO_ASSUMPTIONS = {
  // Average petrol two-wheeler: ~2.2 L / 100 km x 2.31 kg CO2e per litre.
  petrolTwoWheelerKgPerKm: 0.05,
  // Electric scooter: 0.035 kWh/km x 0.71 kg CO2e/kWh (India grid average).
  electricScooterKgPerKm: 0.025,
  bicycleKgPerKm: 0,
  // Packaging footprint per order (production + disposal).
  packagingKg: { standard: 0.06, compostable: 0.025, reusable: 0.01 },
  // Single-use cutlery set (fork, spoon, napkin, sachets).
  cutleryKg: 0.012,
  // Green Points awarded for eco choices on one order.
  points: { lowCarbonDelivery: 10, ecoPackaging: 10, noCutlery: 5 },
};

const round = (value, decimals = 3) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const DELIVERY_MODES = ['standard', 'ev', 'bicycle'];
export const PACKAGING_OPTIONS = ['standard', 'compostable', 'reusable'];

export function computeEcoImpact({
  distanceKm = 2.5,
  deliveryMode = 'standard',
  packaging = 'standard',
  cutlery = true,
} = {}) {
  const km = Math.max(0, Number(distanceKm) || 0);
  const mode = DELIVERY_MODES.includes(deliveryMode) ? deliveryMode : 'standard';
  const pack = PACKAGING_OPTIONS.includes(packaging) ? packaging : 'standard';

  const baselineDelivery = km * ECO_ASSUMPTIONS.petrolTwoWheelerKgPerKm;
  const actualDelivery =
    mode === 'bicycle'
      ? km * ECO_ASSUMPTIONS.bicycleKgPerKm
      : mode === 'ev'
        ? km * ECO_ASSUMPTIONS.electricScooterKgPerKm
        : baselineDelivery;

  const baselinePackaging = ECO_ASSUMPTIONS.packagingKg.standard;
  const actualPackaging = ECO_ASSUMPTIONS.packagingKg[pack];

  // The baseline kitchen sends cutlery by default; we compare against that.
  const baselineCutlery = ECO_ASSUMPTIONS.cutleryKg;
  const actualCutlery = cutlery ? baselineCutlery : 0;

  const baselineCo2Kg = baselineDelivery + baselinePackaging + baselineCutlery;
  const actualCo2Kg = actualDelivery + actualPackaging + actualCutlery;
  const co2SavedKg = round(Math.max(0, baselineCo2Kg - actualCo2Kg), 3);

  let greenPoints = 0;
  if (mode === 'ev' || mode === 'bicycle') greenPoints += ECO_ASSUMPTIONS.points.lowCarbonDelivery;
  if (pack !== 'standard') greenPoints += ECO_ASSUMPTIONS.points.ecoPackaging;
  if (!cutlery) greenPoints += ECO_ASSUMPTIONS.points.noCutlery;

  return {
    deliveryMode: mode,
    packaging: pack,
    cutlery: Boolean(cutlery),
    distanceKm: round(km, 1),
    baselineCo2Kg: round(baselineCo2Kg, 3),
    actualCo2Kg: round(actualCo2Kg, 3),
    co2SavedKg,
    greenPoints,
  };
}

export const ECO_CRITERIA = [
  'Compostable packaging',
  'EV or bicycle delivery fleet',
  'Locally sourced ingredients',
  'Low-waste kitchen',
  'Plant-forward menu',
];

export function ecoTier(points) {
  if (points >= 500) return { name: 'Forest Guardian', next: null, nextAt: null };
  if (points >= 250) return { name: 'Sapling', next: 'Forest Guardian', nextAt: 500 };
  if (points >= 100) return { name: 'Sprout', next: 'Sapling', nextAt: 250 };
  return { name: 'Seedling', next: 'Sprout', nextAt: 100 };
}
