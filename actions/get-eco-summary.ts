import { defineAction } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { requireUser } from "../server/lib/eco.js";

export default defineAction({
  description: "Eco Points balance and CO2 savings for the current user.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const owner = requireUser();
    const db = getDb();
    const rewards = await db
      .select()
      .from(schema.rewards)
      .where(eq(schema.rewards.ownerEmail, owner));
    const orders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.ownerEmail, owner));
    const done = orders.filter((o) => o.status === "delivered");
    return {
      points: rewards.reduce((s, r) => s + r.points, 0),
      co2SavedGrams: done.reduce((s, o) => s + o.co2SavedGrams, 0),
      deliveredOrders: done.length,
      history: rewards.slice(-10).reverse(),
    };
  },
});
