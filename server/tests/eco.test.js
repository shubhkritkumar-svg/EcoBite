import { describe, expect, it } from 'vitest';
import { computeEcoImpact, ecoTier } from '../src/utils/eco.js';
import { computeTotals } from '../src/utils/pricing.js';

describe('Eco impact model', () => {
  it('gives a bicycle order the largest delivery saving', () => {
    const bicycle = computeEcoImpact({
      distanceKm: 3,
      deliveryMode: 'bicycle',
      packaging: 'compostable',
      cutlery: false,
    });
    const ev = computeEcoImpact({ distanceKm: 3, deliveryMode: 'ev', packaging: 'compostable', cutlery: false });
    const petrol = computeEcoImpact({ distanceKm: 3, deliveryMode: 'standard', packaging: 'standard', cutlery: true });

    expect(bicycle.co2SavedKg).toBeGreaterThan(ev.co2SavedKg);
    expect(ev.co2SavedKg).toBeGreaterThan(0);
    expect(petrol.co2SavedKg).toBe(0);
    expect(bicycle.greenPoints).toBe(25);
    expect(ev.greenPoints).toBe(25);
    expect(petrol.greenPoints).toBe(0);
  });

  it('rewards each eco choice separately', () => {
    const none = computeEcoImpact({ deliveryMode: 'standard', packaging: 'standard', cutlery: true });
    const evOnly = computeEcoImpact({ deliveryMode: 'ev', packaging: 'standard', cutlery: true });
    const cutleryOnly = computeEcoImpact({ deliveryMode: 'standard', packaging: 'standard', cutlery: false });

    expect(none.greenPoints).toBe(0);
    expect(evOnly.greenPoints).toBe(10);
    expect(cutleryOnly.greenPoints).toBe(5);
  });

  it('never reports negative savings', () => {
    const impact = computeEcoImpact({ distanceKm: 0, deliveryMode: 'standard', packaging: 'standard', cutlery: true });
    expect(impact.co2SavedKg).toBe(0);
  });

  it('maps Green Points to tiers', () => {
    expect(ecoTier(0).name).toBe('Seedling');
    expect(ecoTier(120).name).toBe('Sprout');
    expect(ecoTier(300).name).toBe('Sapling');
    expect(ecoTier(650).name).toBe('Forest Guardian');
    expect(ecoTier(50).nextAt).toBe(100);
  });
});

describe('Pricing model', () => {
  it('adds delivery, packaging and 5% tax', () => {
    const totals = computeTotals([
      { price: 249, quantity: 2 },
      { price: 59, quantity: 1 },
    ]);
    expect(totals.itemTotal).toBe(557);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.packagingFee).toBe(10);
    expect(totals.taxes).toBe(28);
    expect(totals.total).toBe(595);
  });

  it('charges delivery below the free-delivery threshold', () => {
    const totals = computeTotals([{ price: 199, quantity: 1 }]);
    expect(totals.itemTotal).toBe(199);
    expect(totals.deliveryFee).toBe(25);
    expect(totals.taxes).toBe(10);
    expect(totals.total).toBe(244);
  });
});
