import { defineAction, fail } from "@agent-native/core/action";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Get a restaurant with its menu.",
  schema: z.object({ id: z.string().min(1) }),
  http: { method: "GET" },
  run: async ({ id }) => {
    const db = getDb();
    const [restaurant] = await db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.id, id));
    if (!restaurant) fail("Restaurant not found", { statusCode: 404 });
    const menu = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, id))
      .orderBy(asc(schema.menuItems.category), asc(schema.menuItems.name));
    return { restaurant, menu };
  },
});
