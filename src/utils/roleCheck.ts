/**
 * Shared utilities for role-check upload and update flows.
 * Validation, Cloudinary upload, AssemblyAI transcription, and DB operations.
 */

import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { AssemblyAI } from "assemblyai";
import { db, Questions, eq } from "astro:db";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUDIO_MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
export const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WordTimestamp = {
  text: string;
  start: number;
  end: number;
};

export type ValidationResult =
  | { success: true }
  | { success: false; errors: Record<string, string[]> };

export type SaveQuestionPayload = {
  type_que: string;
  question: string;
  answer: string;
  description: string;
  secure_url: string;
  words: WordTimestamp[];
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates an audio File for upload.
 * Returns structured errors per field; use for action validation feedback.
 */
export function validateAudio(file: File | null | undefined): ValidationResult {
  const errors: Record<string, string[]> = {};

  if (file == null || (typeof file === "object" && "size" in file && file.size === 0)) {
    return { success: false, errors: { audiofile: ["الملف الصوتي مطلوب."] } };
  }

  const f = file as File;
  const typeErrors: string[] = [];
  const sizeErrors: string[] = [];

  if (!f.type.startsWith("audio/") && !ALLOWED_AUDIO_TYPES.includes(f.type)) {
    typeErrors.push("يجب أن يكون الملف بصيغة صوت فقط (مثل mp3, wav, ogg).");
  }

  if (f.size > AUDIO_MAX_SIZE_BYTES) {
    sizeErrors.push(`الحجم الأقصى للملف 1 ميجابايت. (الحالي: ${(f.size / 1024).toFixed(1)} ك.ب)`);
  }

  if (typeErrors.length) errors["audiofile"] = typeErrors;
  if (sizeErrors.length) errors["audiofile"] = [...(errors["audiofile"] ?? []), ...sizeErrors];

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return { success: true };
}

// ---------------------------------------------------------------------------
// Cloudinary
// ---------------------------------------------------------------------------

function getCloudinaryConfig() {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY ?? process.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET ?? process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set.");
  }
  return { cloudName, apiKey, apiSecret };
}

/**
 * Uploads an audio File to Cloudinary and returns the secure URL.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = Readable.from(buffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // Cloudinary uses "video" for audio files; secure_url is playable in <audio>
        folder: "role-check-audio",
      },
      (err, result) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else if (result?.secure_url) resolve(result.secure_url);
        else reject(new Error("Cloudinary did not return a secure_url."));
      }
    );
    stream.pipe(uploadStream);
  });
}

// ---------------------------------------------------------------------------
// AssemblyAI
// ---------------------------------------------------------------------------

function getAssemblyAIClient(): AssemblyAI {
  const apiKey = import.meta.env.ASSEMBLYAI_API_KEY ?? process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY must be set.");
  return new AssemblyAI({ apiKey });
}

/**
 * Transcribes audio from a public URL using AssemblyAI (universal-2).
 * Returns the raw transcript result; use transformWords() for the words array.
 */
export async function transcribeWithAssemblyAI(audioUrl: string): Promise<{ words?: Array<{ text: string; start: number; end: number }> }> {
  const client = getAssemblyAIClient();
  const transcript = await client.transcripts.transcribe({
    audio: audioUrl,
    speech_models: ["universal-2"],
  });

  if (transcript.status === "error") {
    throw new Error(transcript.error ?? "AssemblyAI transcription failed.");
  }

  return transcript as { words?: Array<{ text: string; start: number; end: number }> };
}

/**
 * Transforms AssemblyAI transcript into the required words array format.
 */
export function transformWords(transcript: { words?: Array<{ text: string; start: number; end: number }> }): WordTimestamp[] {
  const words = transcript.words ?? [];
  return words.map((w) => ({
    text: w.text ?? "",
    start: typeof w.start === "number" ? w.start : 0,
    end: typeof w.end === "number" ? w.end : 0,
  }));
}

// ---------------------------------------------------------------------------
// Database (Astro DB / Turso)
// ---------------------------------------------------------------------------

/**
 * Saves a new question to the database.
 * Uses database auto-increment for id; returns the generated id.
 */
export async function saveToDatabase(payload: SaveQuestionPayload): Promise<number> {
  const result = await db
    .insert(Questions)
    .values({
      type_que: payload.type_que,
      question: payload.question,
      answer: payload.answer,
      description: payload.description,
      secure_url: payload.secure_url,
      words: payload.words,
    })
    .returning({ id: Questions.id });

  const id = result[0]?.id;
  if (id == null) {
    throw new Error("Insert succeeded but no id was returned.");
  }
  return id;
}

/**
 * Updates an existing question by id. Optional new audio/words; pass undefined to keep existing.
 */
export async function updateQuestionInDatabase(
  id: number,
  payload: {
    type_que: string;
    question: string;
    answer: string;
    description: string;
    secure_url?: string;
    words?: WordTimestamp[];
  }
): Promise<void> {
  const existing = await db.select().from(Questions).where(eq(Questions.id, id)).limit(1);
  if (existing.length === 0) {
    throw new Error(`Question with id ${id} not found.`);
  }
  await db
    .update(Questions)
    .set({
      type_que: payload.type_que,
      question: payload.question,
      answer: payload.answer,
      description: payload.description,
      ...(payload.secure_url != null && { secure_url: payload.secure_url }),
      ...(payload.words != null && { words: payload.words }),
    })
    .where(eq(Questions.id, id));
}

/**
 * Loads a question by id (used as slug in update page).
 */
export async function getQuestionById(id: number) {
  const rows = await db.select().from(Questions).where(eq(Questions.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Loads a question by URL slug (numeric string id).
 * Returns null for invalid slug or missing question.
 */
export async function getQuestionBySlug(slug: string | undefined): Promise<Awaited<ReturnType<typeof getQuestionById>> | null> {
  if (slug == null || slug === "") return null;
  const id = Number(slug);
  if (!Number.isInteger(id) || id < 1) return null;
  return getQuestionById(id);
}

/**
 * Searches questions by title (type_que) or main question text.
 */
export async function searchQuestions(query: string): Promise<Array<{ id: number; type_que: string; question: string }>> {
  const all = await db.select({ id: Questions.id, type_que: Questions.type_que, question: Questions.question }).from(Questions);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return all.filter(
    (r) =>
      (r.type_que?.toLowerCase().includes(q)) ||
      (r.question?.toLowerCase().includes(q))
  );
}
