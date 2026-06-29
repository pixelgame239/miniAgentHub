import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { pdf } from 'pdf-to-img';
import path from 'path';

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
/**
 * Modern OCR function using Tesseract.js (2026 single-line standard)
 */
async function ocrImageBuffer(imageBuffer: Buffer): Promise<string> {
  // Chỉ định đường dẫn tới thư mục lang-data chứa các file .traineddata của bạn
  const langDataPath = path.join(process.cwd(), 'lang-data');

  const worker = await createWorker(['eng', 'vie'], 1, {
    langPath: langDataPath,
    cacheMethod: 'none', // Không cố gắng check/fetch từ CDN mạng ngoài
    // Nếu môi trường Node.js chặn hoàn toàn fetch, có thể cần ép worker chạy trực tiếp trên main thread
    // bằng cách truyền thêm cấu hình nếu phiên bản tesseract.js của bạn hỗ trợ:
    // workerPath: require.resolve('tesseract.js/src/worker-script/node/index.js')
  });

  const { data: { text } } = await worker.recognize(imageBuffer);
  await worker.terminate();
  return text;
}
/**
 * Universal Content Extractor (2026 Production Standard)
 * Processes: .txt, .docx (text + embedded images OCR), direct images, and .pdf (scanned/text)
 */
export async function extractFileContent(fileBuffer: Buffer, fileExt: string): Promise<string> {
  const ext = fileExt.toLowerCase();

  // 1. Plain Text Files (.txt)
  if (ext === '.txt') {
    return fileBuffer.toString('utf-8');
  }

  // 2. Microsoft Word Files (.docx) - FULLY UPDATED FOR EMBEDDED IMAGES OCR
  if (ext === '.docx') {
    let embeddedImagesText = '';
    let imageCounter = 1;

    // We use convertToHtml because it allows us to intercept and process embedded images
    const options = {
      convertImage: mammoth.images.imgElement(async (image) => {
        try {
          // Read the embedded image directly into a Node.js Buffer
          const imgBuffer = await image.readAsBuffer();
          
          // Perform OCR on this specific image embedded inside the Word document
          const ocrText = await ocrImageBuffer(imgBuffer);
          
          if (ocrText.trim()) {
            embeddedImagesText += `\n\n--- [OCR Text from Embedded Image #${imageCounter}] ---\n${ocrText.trim()}`;
            imageCounter++;
          }
        } catch (ocrError) {
          console.error(`Failed to OCR embedded image #${imageCounter} in DOCX:`, ocrError);
        }
        
        // Return an empty object to avoid inserting giant base64 strings into HTML output
        return { src: "" };
      })
    };

    // Extract both standard text and trigger image OCR hook
    const htmlResult = await mammoth.convertToHtml({ buffer: fileBuffer }, options);
    const rawTextResult = await mammoth.extractRawText({ buffer: fileBuffer });
    
    // Combine standard text with the text extracted from embedded images
    const combinedText = `${rawTextResult.value.trim()}${embeddedImagesText}`;
    return combinedText.trim();
  }

  // 3. Direct Images (.png, .jpg, .jpeg, .webp)
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  if (imageExtensions.includes(ext)) {
    return await ocrImageBuffer(fileBuffer);
  }

  // 4. PDF Files (Converts pages to images, then OCR)
  if (ext === '.pdf') {
    let fullText = '';
    let pageCounter = 1;

    try {
      const document = await pdf(fileBuffer, { scale: 2.0 });

      for await (const pageImageBuffer of document) {
        const pageText = await ocrImageBuffer(pageImageBuffer);
        fullText += `--- Page ${pageCounter} ---\n${pageText}\n\n`;
        pageCounter++;
      }

      return fullText.trim();
    } catch (pdfError) {
      console.error('Error processing PDF:', pdfError);
      throw pdfError;
    }
  }

  throw new Error(`Unsupported file extension: ${fileExt}`);
}