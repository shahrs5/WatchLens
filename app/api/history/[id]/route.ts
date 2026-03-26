import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { deleteHistoryEntry } from "@/lib/history";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = await deleteHistoryEntry(id);

  if (!removed) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  try {
    await del(removed.outputUrl);
  } catch {
    // Blob already gone — that's fine
  }

  return NextResponse.json({ success: true });
}
