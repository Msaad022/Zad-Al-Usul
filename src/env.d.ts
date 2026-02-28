interface ImportMetaEnv {
  readonly CLOUDINARY_CLOUD_NAME?: string;
  readonly CLOUDINARY_API_KEY?: string;
  readonly CLOUDINARY_API_SECRET?: string;
  readonly ASSEMBLYAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
