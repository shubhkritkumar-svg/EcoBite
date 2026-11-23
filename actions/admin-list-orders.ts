import { defineAction } from "@agent-native/core/action";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { requireAdmin } from "../server/lib/eco.js";

export default defineAction({
  description: "Admin: list all orders plus summary stats.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    requireAdmin();
    const orders = await getDb()
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(200);
    const live = orders.filter((o) => o.status !== "cancelled");
    return {
      orders,
      stats: {
        orders: orders.length,
        revenueInr: live.reduce((s, o) => s + o.totalInr, 0),
        co2SavedGrams: live.reduce((s, o) => s + o.co2SavedGrams, 0),
        greenDeliveries: live.filter((o) => o.deliveryMode !== "standard").length,
      },
    };
  },
});
