export interface HistoryEntry {
  id: string;
  createdAt: string;
  outputUrl: string;
  prompt: string;
  referenceCount: number;
  sourceFilename: string;
}

export interface GeminiImagePart {
  mimeType: string;
  base64Data: string;
}

export interface GenerateResult {
  outputUrl: string;
  id: string;
}

export interface BulkGenerateResult {
  results: Array<GenerateResult & { sourceFilename: string }>;
}
