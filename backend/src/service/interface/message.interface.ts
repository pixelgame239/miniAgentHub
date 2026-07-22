import { Stream } from "stream";

export interface AIProviderContext {
  userId: number;
  convId: number;
  currentPromptId: number;
  content: string;
  model: string;
  currentFileContent: string | null;
  signal: AbortSignal;
}

export interface IAIProviderStrategy {
  executePrompt(context: AIProviderContext): Promise<Stream>;
}
export interface FileInput {
  data: string;
  fileName: string;
  mimeType: string;
}

export interface ProcessedFileResult {
  dbFileUrl: string | null;
  dbFileName: string | null;
  dbFileType: string | null;
  currentFileContent: string | null;
}
