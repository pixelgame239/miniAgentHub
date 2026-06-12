import path from "path";

export interface FileInput {
  data: string;       // full base64 data URL: "data:mime/type;base64,..."
  fileName: string;
  mimeType: string;
}

export interface ExtractResult {
  text: string;       // extracted plain text content
  supported: boolean; // false = file type not supported for text extraction
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBase64Buffer(dataUrl: string): Buffer | null {
  const base64Data = dataUrl.split(";base64,").pop();
  if (!base64Data) return null;
  return Buffer.from(base64Data, "base64");
}

function wrap(fileName: string, content: string): string {
  return `--- File: ${fileName} ---\n${content.trim()}\n--- End of ${fileName} ---`;
}

// ─── Extractors ─────────────────────────────────────────────────────────────

async function extractPlainText(buf: Buffer): Promise<string> {
  return buf.toString("utf-8");
}

async function extractJson(buf: Buffer): Promise<string> {
  try {
    const raw = buf.toString("utf-8");
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2); // pretty-print
  } catch {
    return buf.toString("utf-8"); // fallback to raw if invalid JSON
  }
}
// ─── Mime / Extension Map ────────────────────────────────────────────────────

type ExtractorFn = (buf: Buffer) => Promise<string>;

const EXTRACTORS: Record<string, ExtractorFn> = {
  // Plain text variants
  "text/plain": extractPlainText,
  "text/html": extractPlainText,
  "text/xml": extractPlainText,
  "text/markdown": extractPlainText,
  "text/css": extractPlainText,
  "text/javascript": extractPlainText,
  "application/javascript": extractPlainText,
  "application/typescript": extractPlainText,
  "application/xml": extractPlainText,

  // JSON
  "application/json": extractJson,

  // CSV

  // Code files (sent as octet-stream sometimes)
  "application/octet-stream": extractPlainText,
};

// Extension fallback when mimeType is unreliable
const EXT_EXTRACTORS: Record<string, ExtractorFn> = {
  ".txt": extractPlainText,
  ".md": extractPlainText,
  ".html": extractPlainText,
  ".htm": extractPlainText,
  ".xml": extractPlainText,
  ".css": extractPlainText,
  ".js": extractPlainText,
  ".ts": extractPlainText,
  ".jsx": extractPlainText,
  ".tsx": extractPlainText,
  ".py": extractPlainText,
  ".java": extractPlainText,
  ".c": extractPlainText,
  ".cpp": extractPlainText,
  ".cs": extractPlainText,
  ".go": extractPlainText,
  ".rs": extractPlainText,
  ".sh": extractPlainText,
  ".yaml": extractPlainText,
  ".yml": extractPlainText,
  ".toml": extractPlainText,
  ".env": extractPlainText,
  ".log": extractPlainText,
  ".sql": extractPlainText,
  ".json": extractJson,
};

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Extract readable text from a file given as a base64 data URL.
 * Returns { text, supported } — if unsupported, text is an empty string.
 */
export async function extractFileText(file: FileInput): Promise<ExtractResult> {
  const buf = getBase64Buffer(file.data);
  if (!buf) return { text: "", supported: false };

  const ext = path.extname(file.fileName).toLowerCase();

  // Prefer mime type, fall back to extension
  const extractor: ExtractorFn | undefined =
    EXTRACTORS[file.mimeType] ?? EXT_EXTRACTORS[ext];

  if (!extractor) {
    return { text: "", supported: false };
  }

  try {
    const raw = await extractor(buf);
    return { text: wrap(file.fileName, raw), supported: true };
  } catch (err) {
    console.error(`[fileExtractor] Failed to extract ${file.fileName}:`, err);
    return { text: "", supported: false };
  }
}

/**
 * Process multiple files and return a single combined string
 * ready to be prepended to the user's prompt.
 */
export async function buildFileContext(
  files: FileInput[]
): Promise<string> {
  const parts: string[] = [];

  for (const file of files) {
    const { text, supported } = await extractFileText(file);

    if (supported && text) {
      parts.push(text);
    } else {
      // Unsupported type — still tell the model a file was attached
      parts.push(
        `--- File: ${file.fileName} ---\n[Binary file — content not extractable (${file.mimeType})]\n--- End of ${file.fileName} ---`
      );
    }
  }

  return parts.join("\n\n");
}