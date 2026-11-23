import { defineAction } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { requireAdmin } from "../server/lib/eco.js";

export default defineAction({
  description: "Admin: delete a restaurant and its menu.",
  schema: z.object({ id: z.string().min(1) }),
  run: async ({ id }) => {
    requireAdmin();
    const db = getDb();
    await db.delete(schema.menuItems).where(eq(schema.menuItems.restaurantId, id));
    await db.delete(schema.restaurants).where(eq(schema.restaurants.id, id));
    return { id };
  },
});
