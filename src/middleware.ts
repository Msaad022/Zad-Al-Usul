import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  // 1. Only run the middleware for paths that start with `/role-check`
  const pathname = context.url.pathname;
  // Skip requests for prerendered pages
  if (!pathname.startsWith("/role-check") || context.isPrerendered) {
    return next();
  }

  let token: string | undefined;
  try {
    token = context.cookies.get("rolecheck")?.value;
  } catch {
    token = undefined;
  }

  const [emailHash, passHash] = token?.split(":") ?? [];
  const isAdmin =
    emailHash === import.meta.env.ADMIN_EMAIL_HASH &&
    passHash === import.meta.env.ADMIN_PASS_HASH;

  const isUploadPath =
    pathname === "/role-check/upload" || pathname === "/role-check/upload/";
  const isRoleCheckPath =
    pathname === "/role-check" || pathname === "/role-check/";

  // 2. Handle the `/role-check` page
  if (isRoleCheckPath) {
    if (isAdmin) {
      // If the user is an admin and on the /role-check page, redirect them to /upload
      return context.redirect("/role-check/upload");
    }
    // If there's a token but it's not valid, or no token, let them stay on the login page
    return next();
  }

  // 3. Handle the `/role-check/upload` page
  if (isUploadPath) {
    if (!token) {
      // If no token exists, redirect them back to the login page
      return new Response("Unauthorized: please login first", { status: 401 });
    }

    if (!isAdmin) {
      // If a token exists but it's not valid, deny access with a 403 Forbidden status
      return new Response("Forbidden: you do not have access to this page", {
        status: 403,
      });
    }
    // If the user is an admin with a valid token, allow access
    return next();
  }
  // Fallback for any other /role-check paths that don't match the above
  return next();
});
