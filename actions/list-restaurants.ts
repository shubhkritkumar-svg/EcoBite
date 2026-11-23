import { defineAction } from "@agent-native/core/action";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Search and filter restaurants.",
  schema: z.object({
    q: z.string().max(80).optional(),
    cuisine: z.string().max(40).optional(),
    ecoOnly: z.boolean().optional(),
    vegOnly: z.boolean().optional(),
    includeInactive: z.boolean().optional(),
  }),
  http: { method: "GET" },
  run: async ({ q, cuisine, ecoOnly, vegOnly, includeInactive }) => {
    const t = schema.restaurants;
    const conds = [];
    if (!includeInactive) conds.push(eq(t.active, true));
    if (q) {
      const like = `%${q.replace(/[%_]/g, "")}%`;
      conds.push(or(ilike(t.name, like), ilike(t.cuisine, like), ilike(t.city, like))!);
    }
    if (cuisine && cuisine !== "all") conds.push(eq(t.cuisine, cuisine));
    if (ecoOnly) conds.push(eq(t.ecoCertified, true));
    if (vegOnly) conds.push(eq(t.isVeg, true));
    return getDb()
      .select()
      .from(t)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(t.rating), asc(t.name));
  },
});
