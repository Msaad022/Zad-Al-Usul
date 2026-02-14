import { defineAction } from "astro:actions";
import { z } from "zod";
const MAX_SIZE = 2 * (1024 * 1024);

const loginSchema = z.object({
  typeque: z.string().min(8, "حقل ترتيب السؤال يجب أن يكون 8 حرف على الأقل"),
  question: z.string().min(8, "حقل نص السؤال يجب أن يكون 8 حرف على الأقل"),
  answer: z.string().min(8, "حقل إجابة السؤال يجب أن يكون 8 حرف على الأقل"),
  description: z
    .string()
    .min(300, "حقل أشرح السؤال يجب أن يكون 300 حرف على الأقل"),
  audiofile: z
    .instanceof(File, { message: "يجب رفع ملف" })
    .refine((file) => file.size <= MAX_SIZE, {
      message: "الحجم يجب أن يكون أقل من 2 ميجا",
    })
    .refine((file) => file.type.startsWith("audio/"), {
      message: "الملف يجب أن يكون صوت",
    }),
});

export const upload = {
  question: defineAction({
    accept: "form",
    input: loginSchema,
    handler: async ({ typeque, question, description, answer, audiofile }) => {
      console.log(typeque, question, description, answer, audiofile);
    },
  }),
};
