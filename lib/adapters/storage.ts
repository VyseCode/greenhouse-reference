import { ApiError } from "@/lib/api";

export interface ResumeStorageAdapter {
  normalize(value: string): Promise<string>;
}

const urlOnlyAdapter: ResumeStorageAdapter = {
  async normalize(value) {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new ApiError(400, "Enter a valid resume URL (http or https)");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new ApiError(400, "Resume URL must use http or https");
    }
    if (!parsed.hostname) throw new ApiError(400, "Enter a valid resume URL");
    return parsed.toString();
  },
};

export const resumeStorage: ResumeStorageAdapter = urlOnlyAdapter;
