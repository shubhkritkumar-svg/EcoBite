import { defineAction, fail } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { requireAdmin } from "../server/lib/eco.js";

export default defineAction({
  description: "Admin: create or update a restaurant.",
  schema: z.object({
    id: z.string().optional(),
    name: z.string().trim().min(2).max(80),
    cuisine: z.string().trim().min(2).max(40),
    city: z.string().trim().min(2).max(40),
    description: z.string().max(300).default(""),
    imageUrl: z.string().max(500).default(""),
    deliveryMins: z.number().int().min(5).max(120).default(30),
    distanceKm: z.number().min(0.1).max(30).default(3),
    ecoCertified: z.boolean().default(false),
    isVeg: z.boolean().default(false),
    active: z.boolean().default(true),
  }),
  run: async ({ id, ...v }) => {
    requireAdmin();
    const db = getDb();
    if (id) {
      const r = await db.update(schema.restaurants).set(v).where(eq(schema.restaurants.id, id)).returning();
      if (!r.length) fail("Restaurant not found", { statusCode: 404 });
      return r[0];
    }
    const [row] = await db
      .insert(schema.restaurants)
      .values({ id: "r" + randomUUID().slice(0, 8), ...v })
      .returning();
    return row;
  },
});
