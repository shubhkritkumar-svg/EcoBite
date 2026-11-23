import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { requireAdmin } from "../server/lib/eco.js";

export default defineAction({
  description: "Admin: create or update a menu item.",
  schema: z.object({
    id: z.string().optional(),
    restaurantId: z.string().min(1),
    name: z.string().trim().min(2).max(80),
    description: z.string().max(200).default(""),
    category: z.string().trim().min(2).max(30).default("Mains"),
    priceInr: z.number().int().min(1).max(10000),
    isVeg: z.boolean().default(true),
    available: z.boolean().default(true),
  }),
  run: async ({ id, ...v }) => {
    requireAdmin();
    const db = getDb();
    if (id) {
      const r = await db.update(schema.menuItems).set(v).where(eq(schema.menuItems.id, id)).returning();
      if (!r.length) fail("Item not found", { statusCode: 404 });
      return r[0];
    }
    const [row] = await db
      .insert(schema.menuItems)
      .values({ id: "m" + randomUUID().slice(0, 8), ...v })
      .returning();
    return row;
  },
});
