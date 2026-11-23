import { defineAction } from "@agent-native/core/action";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";
import { requireAdmin } from "../server/lib/eco.js";

export default defineAction({
  description: "Admin: delete a menu item.",
  schema: z.object({ id: z.string().min(1) }),
  run: async ({ id }) => {
    requireAdmin();
    await getDb().delete(schema.menuItems).where(eq(schema.menuItems.id, id));
    return { id };
  },
});
