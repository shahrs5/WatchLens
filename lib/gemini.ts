import { GoogleGenAI } from "@google/genai";
import type { GeminiImagePart } from "./types";

const SYSTEM_PROMPT = `You will receive two images:
1. SCENE — a photo of a watch in a setting.
2. REFERENCE — a photo of a different watch.

Your job: Generate a new image that is the SCENE photo but with the REFERENCE watch swapped in.

Rules:
- The ENTIRE watch (case, dial, hands, strap/bracelet, bezel, crown — everything) must come from the REFERENCE. Do NOT mix parts from the two images.
- The watch must sit in the same position, angle, and orientation as the watch in the SCENE.
- Keep the SCENE background, lighting, and surroundings unchanged.
- Reproduce all text and logos on the watch dial exactly as shown in the REFERENCE — do not invent or alter any text.
- The result should look like a real photograph. No watermarks or borders.`;

export async function generateWatchImage(
  sourceImage: GeminiImagePart,
  referenceImages: GeminiImagePart[],
  stylePrompt?: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  parts.push({ text: SYSTEM_PROMPT });

  if (stylePrompt?.trim()) {
    parts.push({ text: `Additional style direction: ${stylePrompt.trim()}` });
  }

  parts.push({ text: "SCENE PHOTO (keep this background, composition, and setting):" });
  parts.push({
    inlineData: {
      mimeType: sourceImage.mimeType,
      data: sourceImage.base64Data,
    },
  });

  parts.push({
    text: `WATCH REFERENCE PHOTO${referenceImages.length > 1 ? "S" : ""} (replace the watch in the scene with this exact watch — ${referenceImages.length} photo${referenceImages.length > 1 ? "s" : ""} of the same watch for detail):`,
  });
  referenceImages.forEach((ref, i) => {
    parts.push({ text: `Watch reference ${i + 1} of ${referenceImages.length}:` });
    parts.push({
      inlineData: {
        mimeType: ref.mimeType,
        data: ref.base64Data,
      },
    });
  });

  parts.push({
    text: "Now swap the watch. Use the ENTIRE watch from the REFERENCE (including its strap/bracelet) and place it in the same position and angle as the watch in the SCENE. Keep the background exactly as-is.",
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        imageSize: "2K",
        aspectRatio: "1:1",
      },
    },
  });

  const candidates = response.candidates ?? [];
  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
    }
  }

  throw new Error(
    "Gemini returned no image. Try adjusting your prompt or reference images."
  );
}
