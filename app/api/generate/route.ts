import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { put } from "@vercel/blob";
import { generateWatchImage } from "@/lib/gemini";
import { appendHistory } from "@/lib/history";
import type { GeminiImagePart } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

async function fileToGeminiPart(file: File): Promise<GeminiImagePart> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    mimeType: file.type || "image/jpeg",
    base64Data: buffer.toString("base64"),
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const sourceFile = formData.get("source") as File | null;
    if (!sourceFile) {
      return NextResponse.json({ error: "No source image provided" }, { status: 400 });
    }

    const referenceFiles = formData.getAll("references[]") as File[];
    if (referenceFiles.length === 0) {
      return NextResponse.json({ error: "At least one reference image is required" }, { status: 400 });
    }
    if (referenceFiles.length > 14) {
      return NextResponse.json({ error: "Maximum 14 reference images allowed" }, { status: 400 });
    }

    const prompt = (formData.get("prompt") as string) || "";

    const [sourcePart, ...referenceParts] = await Promise.all([
      fileToGeminiPart(sourceFile),
      ...referenceFiles.map(fileToGeminiPart),
    ]);

    const outputBase64 = await generateWatchImage(sourcePart, referenceParts, prompt);

    const id = uuidv4();
    const { url } = await put(`history/${id}.png`, Buffer.from(outputBase64, "base64"), {
      access: "public",
      contentType: "image/png",
    });

    await appendHistory({
      id,
      createdAt: new Date().toISOString(),
      outputUrl: url,
      prompt,
      referenceCount: referenceFiles.length,
      sourceFilename: sourceFile.name,
    });

    return NextResponse.json({ outputUrl: url, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[/api/generate]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
