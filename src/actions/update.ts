import { defineAction } from "astro:actions";
import { z } from "zod";

const updateSchema = z.object({
  search: z.string().min(8, "البحث يجب أن يكون 8 حرف على الأقل"),
});

export const update = {
  login: defineAction({
    accept: "form",
    input: updateSchema,
    handler: async ({ search }, ctx) => {
      return true;
    },
  }),
};
