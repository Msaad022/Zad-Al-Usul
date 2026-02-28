import { defineAction, ActionError } from "astro:actions";
import { z } from "zod";
import {
  AUDIO_MAX_SIZE_BYTES,
  getQuestionById,
  updateQuestionInDatabase,
  uploadToCloudinary,
  transcribeWithAssemblyAI,
  transformWords,
  type WordTimestamp,
} from "../../utils/roleCheck";

const updateSchema = z.object({
  slug: z.string().min(1, "معرف السؤال مطلوب."),
  typeque: z
    .string({ required_error: "ترتيب السؤال مطلوب.",
      invalid_type_error: "ترتيب السؤال يجب أن يكون نصًا",
     })
    .min(6, "حقل ترتيب السؤال يجب أن يكون 6 أحرف على الأقل"),
  question: z
    .string({ required_error: "نص السؤال مطلوب." ,
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
    .union([z.instanceof(File), z.undefined()])
    .optional()
    .refine(
      (file) => {
        // No file or empty file = keep current audio, skip validation
        if (!file || (typeof file === "object" && "size" in file && (file as File).size === 0))
          return true;
        // New file: must be audio and ≤ 1MB
        return (
          typeof file === "object" &&
          "size" in file &&
          "type" in file &&
          (file as File).size > 0 &&
          (file as File).size <= AUDIO_MAX_SIZE_BYTES &&
          (file as File).type.startsWith("audio/")
        );
      },
      "الملف يجب أن يكون صوتاً ولا يتجاوز 1 ميجابايت."
    ),
});

export const update = {
  question: defineAction({
    accept: "form",
    input: updateSchema,
    handler: async ({ slug, typeque, question, answer, description, audiofile }) => {
      const id = Number(slug);
      if (Number.isNaN(id) || id < 1) {
        throw new ActionError({ code: "BAD_REQUEST", message: "معرف السؤال غير صالح." });
      }

      try {
        const existing = await getQuestionById(id);
        if (!existing) {
          throw new ActionError({ code: "NOT_FOUND", message: "السؤال غير موجود." });
        }

        let secureUrl: string | undefined = existing.secure_url ?? undefined;
        let words: WordTimestamp[] | undefined = (existing.words as WordTimestamp[]) ?? undefined;

        if (audiofile instanceof File && audiofile.size > 0) {
          secureUrl = await uploadToCloudinary(audiofile);
          const transcript = await transcribeWithAssemblyAI(secureUrl);
          words = transformWords(transcript);
        }

        await updateQuestionInDatabase(id, {
          type_que: typeque,
          question,
          answer,
          description,
          secure_url: secureUrl,
          words,
        });

        return { success: true, slug: String(id), message: "تم تحديث السؤال بنجاح." };
      } catch (err) {
        if (err instanceof ActionError) throw err;
        const message = err instanceof Error ? err.message : "حدث خطأ أثناء تحديث السؤال.";
        let actionMessage = message;
        if (message.includes("CLOUDINARY")) actionMessage = "خطأ في رفع الملف.";
        else if (message.includes("ASSEMBLYAI")) actionMessage = "خطأ في التحويل إلى نص.";
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: actionMessage,
        });
      }
    },
  }),
};
