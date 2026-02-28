import { defineAction, ActionError } from "astro:actions";
import { z } from "zod";
import {
  AUDIO_MAX_SIZE_BYTES,
  uploadToCloudinary,
  transcribeWithAssemblyAI,
  transformWords,
  saveToDatabase,
} from "../../utils/roleCheck";

const uploadSchema = z.object({
  typeque: z
    .string({ required_error: "ترتيب السؤال مطلوب.",
      invalid_type_error: "ترتيب السؤال يجب أن يكون نصًا",
     })
    .min(6, "حقل ترتيب السؤال يجب أن يكون 6 أحرف على الأقل"),
  question: z
    .string({ required_error: "نص السؤال مطلوب.",
      invalid_type_error: "نص السؤال يجب أن يكون نصًا",
     })
    .min(6, "حقل نص السؤال يجب أن يكون 6 أحرف على الأقل"),
  answer: z
    .string({ required_error: "إجابة السؤال مطلوبة.",
      invalid_type_error: "إجابة السؤال يجب أن يكون نصًا",
     })
    .min(6, "حقل إجابة السؤال يجب أن يكون 6 أحرف على الأقل"),
  description: z
    .string({ required_error: "شرح السؤال مطلوب.",
      invalid_type_error: "شرح السؤال يجب أن يكون نصًا",
     })
    .min(300, "حقل شرح السؤال يجب أن يكون 300 حرف على الأقل"),
  audiofile: z
    .instanceof(File, { message: "يجب رفع ملف صوتي." })
    .refine((file) => file.size > 0, "الملف فارغ.")
    .refine((file) => file.size <= AUDIO_MAX_SIZE_BYTES, "الحجم الأقصى للملف 1 ميجابايت.")
    .refine(
      (file) => file.type.startsWith("audio/"),
      "يجب أن يكون الملف بصيغة صوت فقط (مثل mp3, wav, ogg)."
    ),
});

export const upload = {
  question: defineAction({
    accept: "form",
    input: uploadSchema,
    handler: async ({ typeque, question, answer, description, audiofile }) => {
      try {
        const secureUrl = await uploadToCloudinary(audiofile);
        const transcript = await transcribeWithAssemblyAI(secureUrl);
        const words = transformWords(transcript);

        const id = await saveToDatabase({
          type_que: typeque,
          question,
          answer,
          description,
          secure_url: secureUrl,
          words,
        });

        return { success: true, id, slug: String(id), message: "تم رفع السؤال بنجاح" };
      } catch (err) {
        if (err instanceof ActionError) throw err;
        const message = err instanceof Error ? err.message : "حدث خطأ أثناء رفع السؤال.";
        let actionMessage = message;
        if (message.includes("CLOUDINARY")) actionMessage = "خطأ في رفع الملف. تحقق من إعدادات Cloudinary.";
        else if (message.includes("ASSEMBLYAI")) actionMessage = "خطأ في التحويل إلى نص. تحقق من مفتاح AssemblyAI.";
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: actionMessage,
        });
      }
    },
  }),
};
