import { defineAction } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { z } from "zod";
import { isAdminEmail } from "../server/lib/eco.js";

export default defineAction({
  description: "Return the current user's email and whether they are an admin.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const email = getRequestUserEmail() ?? null;
    return { email, isAdmin: isAdminEmail(email) };
  },
});
