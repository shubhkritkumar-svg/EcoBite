import { defineAction } from "@agent-native/core/action";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { requireUser } from "../server/lib/eco.js";

export default defineAction({
  description: "List the current user's orders with line items.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const owner = requireUser();
    const db = getDb();
    const orders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.ownerEmail, owner))
      .orderBy(desc(schema.orders.createdAt))
      .limit(100);
    const items = orders.length
      ? await db
          .select()
          .from(schema.orderItems)
          .where(inArray(schema.orderItems.orderId, orders.map((o) => o.id)))
      : [];
    return orders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
  },
});
