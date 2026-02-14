import { defineAction } from "astro:actions";
import { z } from "zod";

const searchSchema = z.object({
  search: z.string().min(8, "البحث يجب أن يكون 8 حرف على الأقل"),
});

export const search = {
  question: defineAction({
    accept: "form",
    input: searchSchema,
    handler: async ({ search }, ctx) => {
      return true;
    },
  }),
};
