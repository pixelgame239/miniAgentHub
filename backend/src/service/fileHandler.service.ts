import path from "path";
import crypto from "crypto";
import fs from "fs";
import { extractFileContent } from "../utils/fileExtractor";
import { MyError } from "../utils/MyError";
import type { FileInput, ProcessedFileResult } from "./interface/message.interface";

export class FileHandlerService {
  public static async processPrimaryFile(
    files: FileInput[] | undefined,
    userId: number,
    convId: number
  ): Promise<ProcessedFileResult> {
    const primaryFile = files && files.length > 0 ? files[0] : null;
    let dbFileUrl: string | null = null;
    let dbFileName: string | null = null;
    let dbFileType: string | null = null;
    let currentFileContent: string | null = null;

    if (!primaryFile) {
      return { dbFileUrl, dbFileName, dbFileType, currentFileContent };
    }

    const base64Data = primaryFile.data.split(";base64,").pop();
    if (base64Data) {
      const fileBuffer = Buffer.from(base64Data, "base64");
      const fileExt = path.extname(primaryFile.fileName);

      try {
        currentFileContent = await extractFileContent(fileBuffer, fileExt);
      } catch (error) {
        console.error("File Extraction Error:", error);
        throw new MyError(`Failed to extract content from file`, 500);
      }

      const randomSuffix = crypto.randomBytes(3).toString("hex");
      const uniqueFileName = `${primaryFile.fileName}-${randomSuffix}${fileExt}`;
      const dirPath = path.join(process.cwd(), "files", userId.toString(), convId.toString());
      const filePath = path.join(dirPath, uniqueFileName);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, fileBuffer);

      dbFileUrl = `/static-files/${userId}/${convId}/${uniqueFileName}`;
      dbFileName = primaryFile.fileName;
      dbFileType = primaryFile.mimeType;
    }

    return { dbFileUrl, dbFileName, dbFileType, currentFileContent };
  }
}