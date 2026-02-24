import { defineAction, ActionError } from "astro:actions";
import { z } from "zod";
import { hashPassword, VerifyUserExist } from "../utils";

const loginSchema = z.object({
  email: z
    .string({
      required_error: "يرجى إدخال البريد الإلكتروني",
      invalid_type_error: "البريد الإلكتروني يجب أن يكون نصًا",
    })
    .min(12, "البريد الإلكتروني يجب أن يكون 12 حرف على الأقل")
    .email("البريد الإلكتروني غير صالح"),
  password: z
    .string({
      required_error: "يرجى إدخال كلمة المرور",
      invalid_type_error: "كلمة المرور يجب أن تكون نصًا",
    })
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const auth = {
  login: defineAction({
    accept: "form",
    input: loginSchema,
    handler: async ({ email, password }, ctx) => {
      let str = `${hashPassword(email)}:${hashPassword(password)}`;
      if (!VerifyUserExist(str)) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "البريد الإلكتروني أو كلمة المرور غير صالحة.",
        });
      }
      ctx.cookies.set("rolecheck", str, {
        path: "/role-check",
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 3,
      });
      return true;
    },
  }),
};
