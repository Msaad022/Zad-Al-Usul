import { auth } from "./auth";
import { upload } from "./role-check/upload";
import { search } from "./search";
import { update } from "./role-check/update";

export const server = {
  auth,
  upload,
  search,
  update,
};
