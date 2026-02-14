/**
 * A safe wrapper around Astro.cookies.get()
 */

import type { AstroGlobal } from "astro";

// 1. Get the type of a single cookie from the AstroGlobal['cookies'] property.
// AstroGlobal['cookies']['get'] returns this type or undefined.
type SingleCookie = ReturnType<AstroGlobal["cookies"]["get"]>;

// OR, often the type is simply available under a different name or can be imported.
// In newer versions of Astro, you might look for:
// import type { AstroCookie } from "astro";
// However, the ReturnType method is robust.

export function safeGetCookie(
  Astro: AstroGlobal,
  name: string
): SingleCookie | undefined {
  try {
    return Astro.cookies.get(name);
  } catch {
    return undefined;
  }
}
