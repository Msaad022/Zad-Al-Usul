// src/content/config.ts
import { defineCollection, z } from "astro:content";

const audioCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    artist: z.string(),
    publicId: z.string(), // This is the unique ID from Cloudinary
  }),
});

export const collections = {
  audio: audioCollection,
};
