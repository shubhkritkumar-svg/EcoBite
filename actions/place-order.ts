import { defineAction, fail } from "@agent-native/core/action";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import {
  computeEco,
  DELIVERY_MODES,
  ECO_PACKAGING_FEE,
  requireUser,
} from "../server/lib/eco.js";

export default defineAction({
  description:
    "Place an order. Prices and totals are recomputed server-side from the database. Payment is SIMULATED.",
  schema: z.object({
    restaurantId: z.string().min(1),
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(1),
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .min(1)
      .max(40),
    deliveryMode: z.enum(DELIVERY_MODES),
    ecoPackaging: z.boolean(),
    address: z.string().trim().min(8, "Enter a full delivery address").max(300),
    paymentMethod: z.enum(["simulated-upi", "simulated-card", "simulated-cod"]),
  }),
  run: async (input) => {
    const owner = requireUser();
    const db = getDb();
    const [rest] = await db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.id, input.restaurantId));
    if (!rest || !rest.active) fail("Restaurant unavailable", { statusCode: 404 });

    const ids = [...new Set(input.items.map((i) => i.menuItemId))];
    const menu = await db
      .select()
      .from(schema.menuItems)
      .where(
        and(
          eq(schema.menuItems.restaurantId, rest.id),
          inArray(schema.menuItems.id, ids),
        ),
      );
    const byId = new Map(menu.map((m) => [m.id, m]));
    let subtotal = 0;
    const lines = input.items.map((i) => {
      const m = byId.get(i.menuItemId);
      if (!m || !m.available) fail("An item in your cart is unavailable", { statusCode: 400 });
      subtotal += m.priceInr * i.quantity;
      return { m, quantity: i.quantity };
    });

    const deliveryFee = subtotal >= 500 ? 0 : input.deliveryMode === "ev" ? 35 : 30;
    const packagingFee = input.ecoPackaging ? ECO_PACKAGING_FEE : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + packagingFee + tax;
    const eco = computeEco(input.deliveryMode, rest.distanceKm, input.ecoPackaging, subtotal);
    const orderId = "ECO-" + randomUUID().slice(0, 8).toUpperCase();

    await db.insert(schema.orders).values({
      id: orderId,
      ownerEmail: owner,
      restaurantId: rest.id,
      restaurantName: rest.name,
      deliveryMode: input.deliveryMode,
      ecoPackaging: input.ecoPackaging,
      address: input.address,
      paymentMethod: input.paymentMethod,
      subtotalInr: subtotal,
      deliveryFeeInr: deliveryFee,
      packagingFeeInr: packagingFee,
      taxInr: tax,
      totalInr: total,
      co2SavedGrams: eco.co2SavedGrams,
      ecoPointsEarned: eco.points,
    });
    await db.insert(schema.orderItems).values(
      lines.map((l) => ({
        id: randomUUID(),
        orderId,
        menuItemId: l.m.id,
        name: l.m.name,
        unitPriceInr: l.m.priceInr,
        quantity: l.quantity,
      })),
    );
    return { orderId, total, co2SavedGrams: eco.co2SavedGrams, pointsPending: eco.points };
  },
});
