import { GoogleGenAI } from "@google/genai";
import type { GeminiImagePart } from "./types";

const SYSTEM_PROMPT = `You are a professional watch photography compositor.

Your task:
Replace the watch in the SCENE PHOTO with the watch shown in the WATCH REFERENCE PHOTO(S).
Keep the background, composition, surface, props, and overall scene exactly as they appear in the SCENE PHOTO.

WHAT TO TAKE FROM THE SCENE PHOTO (keep unchanged):
- Background, surface, and environment
- Composition and framing
- Camera angle and perspective
- Any props or surrounding objects

WHAT TO TAKE FROM THE WATCH REFERENCE PHOTO(S) (reproduce exactly):
- The watch itself — every detail, faithfully
- Brand logo (exact text, font, position on dial — do NOT alter or hallucinate)
- Dial style, colour, texture, indices, and all text
- Hour, minute, and second hand shapes, colours, and current positions
- Case shape, proportions, material, and finish
- Strap or bracelet texture, colour, and material
- Crown and any time-adjusting buttons or pushers
- Lighting and reflections as they appear on the watch in the reference

The result should look like a professional photograph of the reference watch
placed naturally into the scene from the scene photo.

Output a square (1:1) or portrait (4:5) image optimised for Instagram.
Do not add watermarks, borders, or text overlays.`;

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
    text: "Now generate the composite: the scene from the SCENE PHOTO with the watch from the WATCH REFERENCE faithfully reproduced in it.",
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
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
