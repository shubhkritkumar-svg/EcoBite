import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { ORDER_STATUSES, requireAdmin } from "../server/lib/eco.js";

export default defineAction({
  description: "Admin: update an order's status. Delivering awards Eco Points once.",
  schema: z.object({ id: z.string().min(1), status: z.enum(ORDER_STATUSES) }),
  run: async ({ id, status }) => {
    requireAdmin();
    const db = getDb();
    const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!o) fail("Order not found", { statusCode: 404 });
    await db
      .update(schema.orders)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(schema.orders.id, id));
    if (status === "delivered") {
      const existing = await db
        .select()
        .from(schema.rewards)
        .where(eq(schema.rewards.orderId, id));
      if (!existing.length) {
        await db.insert(schema.rewards).values({
          id: randomUUID(),
          ownerEmail: o.ownerEmail,
          orderId: id,
          points: o.ecoPointsEarned,
          reason: `Order ${id} delivered (${o.deliveryMode} delivery${o.ecoPackaging ? ", eco packaging" : ""})`,
        });
      }
    }
    return { id, status };
  },
});
