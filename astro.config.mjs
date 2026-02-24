// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import node from "@astrojs/node";

import db from "@astrojs/db";

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [db()],
});
