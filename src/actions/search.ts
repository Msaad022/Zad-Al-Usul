import { defineAction, ActionError } from "astro:actions";
import { z } from "zod";
import { searchQuestions } from "../utils/roleCheck";

const searchSchema = z.object({
  search: z
    .string({ required_error: "البحث مطلوب." ,
      invalid_type_error: "البحث يجب أن يكون نصًا",
    })
    .min(1, "أدخل نص البحث.")
    .max(500, "نص البحث طويل جداً."),
});

export const search = {
  question: defineAction({
    accept: "form",
    input: searchSchema,
    handler: async ({ search: query }) => {
      try {
        const results = await searchQuestions(query);
        if (results.length === 0) {
          return { success: false, message: "السؤال غير موجود", results: [] };
        }
        return {
          success: true,
          results: results.map((r) => ({ id: r.id, type_que: r.type_que, question: r.question, slug: String(r.id) })),
          message: undefined,
        };
      } catch (err) {
        if (err instanceof ActionError) throw err;
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء البحث.",
        });
      }
    },
  }),
};
