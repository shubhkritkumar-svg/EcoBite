import { fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";

export const DELIVERY_MODES = ["standard", "ev", "bicycle"] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];
export const ORDER_STATUSES = [
  "placed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const BASELINE_G_PER_KM = 150;
const MODE_G_PER_KM: Record<DeliveryMode, number> = {
  standard: 150,
  ev: 30,
  bicycle: 0,
};
const MODE_BONUS_POINTS: Record<DeliveryMode, number> = {
  standard: 0,
  ev: 10,
  bicycle: 20,
};

export const ECO_PACKAGING_FEE = 8;
export const ECO_PACKAGING_SAVED_G = 60;

export function requireUser(): string {
  const email = getRequestUserEmail();
  if (!email) fail("Please log in first", { statusCode: 401 });
  return email;
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "admin@ecobite.in")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null) {
  return !!email && adminEmails().includes(email.toLowerCase());
}

export function requireAdmin(): string {
  const email = requireUser();
  if (!isAdminEmail(email)) fail("Admin access required", { statusCode: 403 });
  return email;
}

export function computeEco(
  mode: DeliveryMode,
  distanceKm: number,
  ecoPackaging: boolean,
  subtotal: number,
) {
  const saved =
    Math.round(
      (BASELINE_G_PER_KM - MODE_G_PER_KM[mode]) * distanceKm * 2,
    ) + (ecoPackaging ? ECO_PACKAGING_SAVED_G : 0);
  const points =
    Math.floor(subtotal / 10) +
    MODE_BONUS_POINTS[mode] +
    (ecoPackaging ? 5 : 0);
  return { co2SavedGrams: saved, points };
}
