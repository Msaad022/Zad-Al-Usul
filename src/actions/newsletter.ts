import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";

export const newsletter = {
  newsletterAction: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email(),
      terms: z.boolean(),
    }),
    handler: async ({ email, terms }) => {
      if (email !== "cat@cat.com") {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "البريد الإلكتروني أو كلمة المرور غير صالحة.",
        });
      }
      return email;
    },
  }),
};
