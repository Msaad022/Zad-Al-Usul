import cloudinary from "../config.js";

/**
 * Custom error class for HTTP-related errors.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;

    // Ensure instanceof works correctly across environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 *  AudioProvider interface defines the contract for any audio provider implementation.
 */
export interface AudioProvider {
  getAudioByNumber(n: number): Promise<IAudio>;
}

/**
 * Represents an audio resource.
 */
export interface IAudio {
  status: number;
  message: string;
  asset_id: string;
  folder: string;
  filename: string;
  format: string;
  duration: number;
  secure_url: string;
}

/**
 * Maps a Cloudinary asset object to an IAudio DTO.
 */
function toAudioDTO(asset: any): IAudio {
  return {
    status: 200,
    message: "Audio retrieved successfully",
    asset_id: asset.asset_id,
    folder: asset.folder,
    filename: asset.filename,
    format: asset.format,
    duration: asset.duration,
    secure_url: asset.secure_url,
  };
}

/**
 * Creates a promise that resolves after a specified delay.
 * @param ms - The delay in milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * CloudinaryAudioProvider is a concrete implementation of the AudioProvider interface that retrieves audio files from Cloudinary.
 * @param n - The number of the audio file to retrieve (e.g., 1, 2, 3).
 */
export class CloudinaryAudioProvider implements AudioProvider {
  async getAudioByNumber(n: number): Promise<IAudio> {
    const prefix = `El_Aqida/3aqeeda${n}_`;

    const res = await cloudinary.search
      .expression(`public_id:${prefix}*`)
      .max_results(1)
      .execute();

    if (!res.resources || res.resources.length === 0) {
      throw new HttpError(404, `Audio with number ${n} not found`);
    }

    return toAudioDTO(res.resources[0]);
  }
}
/**
 * StorageProvider is a type that defines the supported audio storage providers.
 * @type {StorageProvider} - A string literal type that represents the supported audio storage providers.
 * @param {string} provider - The name of the storage provider to use (e.g., "cloudinary").
 * @returns {AudioProvider} An instance of a class that implements the AudioProvider interface, corresponding to the specified storage provider.
 * @throws {Error} Throws an error if an unsupported storage provider is specified.
 */
type StorageProvider = "cloudinary";

export class AudioStorageFactory {
  static create(provider: StorageProvider): AudioProvider {
    switch (provider) {
      case "cloudinary":
        return new CloudinaryAudioProvider();
      default:
        throw new Error("Unsupported storage provider");
    }
  }
}
/**
 * AudioService is responsible for handling audio retrieval logic, including simulating response delays and error handling.
 * @param audioProvider - An instance of a class that implements the AudioProvider interface, used to fetch audio resources.
 * @returns The audio resource object or an error object containing status and message.
 */

export class AudioService {
  constructor(private audioProvider: AudioProvider) {}
  /**
   * @param n - The number of the audio file to retrieve (e.g., 1, 2, 3).
   * @param ms - The simulated response delay in milliseconds (default is 1000ms).
   */
  async getAudio(n: number, ms = 1000) {
    await delay(ms);

    try {
      return await this.audioProvider.getAudioByNumber(n);
    } catch (err: any) {
      if (err instanceof HttpError) {
        return { status: err.status, message: err.message };
      }

      if (err?.error?.http_code) {
        return {
          status: err.error.http_code,
          message: err.error.message,
        };
      }

      return { status: 500, message: "Unexpected error" };
    }
  }
}
