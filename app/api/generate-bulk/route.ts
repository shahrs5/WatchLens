import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { put } from "@vercel/blob";
import { generateWatchImage } from "@/lib/gemini";
import { appendHistory } from "@/lib/history";
import type { GeminiImagePart } from "@/lib/types";

export const maxDuration = 300;
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

    const sourceFiles = formData.getAll("sources[]") as File[];
    if (sourceFiles.length === 0) {
      return NextResponse.json({ error: "No source images provided" }, { status: 400 });
    }
    if (sourceFiles.length > 20) {
      return NextResponse.json({ error: "Maximum 20 source images allowed" }, { status: 400 });
    }

    const referenceFiles = formData.getAll("references[]") as File[];
    if (referenceFiles.length === 0) {
      return NextResponse.json({ error: "At least one reference image is required" }, { status: 400 });
    }
    if (referenceFiles.length > 14) {
      return NextResponse.json({ error: "Maximum 14 reference images allowed" }, { status: 400 });
    }

    const prompt = (formData.get("prompt") as string) || "";
    const referenceParts = await Promise.all(referenceFiles.map(fileToGeminiPart));
    const results = [];

    for (const sourceFile of sourceFiles) {
      const sourcePart = await fileToGeminiPart(sourceFile);
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

      results.push({ id, outputUrl: url, sourceFilename: sourceFile.name });
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bulk generation failed";
    console.error("[/api/generate-bulk]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
