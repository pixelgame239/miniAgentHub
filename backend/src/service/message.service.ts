import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AIService } from "./ai.service";
import { MyError } from "../utils/MyError";
import { UNAUTHORIZED_ERROR } from "../utils/generalKey";
import { FileHandlerService } from "./fileHandler.service";
import { AIProviderFactory } from "../utils/AIProviderFactory";

const providerFactory = new AIProviderFactory();

export class MessageService {
  private activeControllers = new Map<number, AbortController>();
  private extractToken(parsed: any) {
    if (!parsed) return null;

    // 1. Dạng OpenAI / Groq / OpenRouter
    if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
      const delta = parsed.choices[0].delta;
      if (delta && typeof delta.content === "string") {
        return { event: "token", data: delta.content };
      }
      if (delta && typeof delta.reasoning === "string" && !delta.channel) {
        return { event: "token", data: delta.reasoning };
      }
      return null;
    }

    // 2. Dạng Flowise hoặc Custom SSE Payload (Có thuộc tính event)
    if (parsed.event && parsed.data !== undefined) {
      return { event: parsed.event, data: String(parsed.data) };
    }

    return null;
  }
  public async sendPrompt(
    convId: number,
    content: string,
    model: string,
    res: Response,
    userId: number,
    files?: { data: string; fileName: string; mimeType: string }[]
  ): Promise<void> {
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: convId, userId: userId },
    });

    if (!existingConversation) {
      throw new MyError(UNAUTHORIZED_ERROR, 401);
    }
    if (this.activeControllers.has(convId)) {
      this.activeControllers.get(convId)?.abort();
      this.activeControllers.delete(convId);
    }

    const axiosController = new AbortController();
    this.activeControllers.set(convId, axiosController);
    const { dbFileUrl, dbFileName, dbFileType, currentFileContent } = await FileHandlerService.processPrimaryFile(files, userId, convId);
    const newMessage = await prisma.message.create({
      data: { 
        content, 
        conversationId: convId, 
        type: "prompt",
        fileUrl: dbFileUrl,   // Đã chuyển đúng vị trí về đây
        aiModel: model,
        fileName: dbFileName,
        fileType: dbFileType,
        fileContent: currentFileContent // Lưu nội dung bóc tách vào cột fileContent
      },
    });
    const provider = providerFactory.getStrategy(model);
    const stream = await provider.executePrompt({
      userId,
      convId,
      currentPromptId: newMessage.id,
      content,
      model,
      currentFileContent,
      signal: axiosController.signal
    });
    const placeholderAiMessage = await prisma.message.create({
      data: {
        content: "", 
        conversationId: convId,
        type: "response",
        aiModel: model,
        isCompleted: false // Mặc định chưa hoàn thành
      },
    });
    await this.handleStreamResponse({
      stream,
      res,
      convId,
      model,
      placeholderId: placeholderAiMessage.id,
      axiosController,
    });
  }
  private handleStreamResponse(params: {
    stream: any;
    res: Response;
    convId: number;
    model: string;
    placeholderId: number;
    axiosController: AbortController;
  }): Promise<void> {
    const { stream, res, convId, model, placeholderId, axiosController } = params;

    return new Promise<void>((resolve) => {
      let cleanAccumulatedContent = "";
      let streamBuffer = "";
      let isStreamFinished = false;
      let isAnalysisChannel = false;
      let wasAbortedByUser = false;

      // Hàm đóng giao dịch DB và Response Stream
      const handleFinalizeAndSendId = async (completed: boolean, isError: boolean = false) => {
        const finalCompletedStatus = wasAbortedByUser ? false : completed;
        if (isStreamFinished) return;
        isStreamFinished = true;
        this.activeControllers.delete(convId);

        const savedText = cleanAccumulatedContent.trim();
        if (!savedText && !isError) {
          if (!res.writableEnded) res.end();
          return;
        }

        try {
          await prisma.message.update({
            where: { id: placeholderId },
            data: {
              content: savedText,
              conversationId: convId,
              type: isError ? "error" : "response",
              aiModel: model,
              isCompleted: finalCompletedStatus,
            },
          });
        } catch (err) {
          console.error("[DB ERROR] Saved to Database failed:", err);
        }

        if (!res.writableEnded) {
          res.end();
        }
      };

      // Listener giải phóng tài nguyên khi client disconnect
      const cleanup = async () => {
        if (isStreamFinished) {
          wasAbortedByUser = true;
          console.log(`[ABORT IGNORED] Client sent abort signal for ${model} which has already finished.`);
          return;
        }
        wasAbortedByUser = true;
        console.log(`[ABORT DETECTED] ===== Abortion successful =====`);
        console.log(`[ABORT DETECTED] Time: ${new Date().toISOString()} | Model: ${model}`);

        res.removeListener("close", cleanup);

        if (stream) {
          stream.removeAllListeners("data");
          stream.removeAllListeners("end");
          stream.removeAllListeners("error");
          if (typeof stream.destroy === "function") {
            stream.destroy();
          }
        }

        const currentController = this.activeControllers.get(convId);
        if (currentController) {
          currentController.abort();
          this.activeControllers.delete(convId);
        }

        axiosController.abort();
        await handleFinalizeAndSendId(false, false);
      };

      res.on("close", cleanup);

      // Xử lý dữ liệu nhận được từ Stream
      stream.on("data", (chunk: Buffer) => {
        if (isStreamFinished || axiosController.signal.aborted || res.writableEnded) {
          return;
        }
        console.log(`[STREAM DATA] Received chunk for model ${model}:`, chunk.toString("utf-8"));
        streamBuffer += chunk.toString("utf-8");
        const lines = streamBuffer.split("\n");
        streamBuffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);

            // Kiểm tra phân tách kênh suy nghĩ (analysis/reasoning)
            const delta = parsed.choices?.[0]?.delta;
            if (delta) {
              if (delta.channel === "analysis" || delta.reasoning !== undefined) {
                isAnalysisChannel = true;
              } else if (delta.content !== undefined || (delta.channel && delta.channel !== "analysis")) {
                isAnalysisChannel = false;
              }
            }

            if (!isAnalysisChannel) {
              const token = this.extractToken(parsed);
              console.log("Return this:", JSON.stringify(token));
              if (token) {
                const cleanToken = token.data.replace(/\r/g, "").replace(/\u0000/g, "");
                cleanAccumulatedContent += cleanToken;
                if(token.event === "token") {
                  if (!res.writableEnded) {
                    res.write(`stream: ${JSON.stringify({ event: "token", data: cleanToken, responseId: placeholderId })}\n\n`);
                  }
                }
                if(token.event === "error"){
                  if (!res.writableEnded) {
                    res.write(`stream: ${JSON.stringify({ event: "error", data: cleanToken, responseId: placeholderId })}\n\n`);
                  }
                }
              }
            }
          } catch (err) {
            // Buffer chưa đủ dòng để parse JSON sẽ được dồn qua chunk tiếp theo
          }
        }
      });

      stream.on("end", async () => {
        console.log(`[STREAM END] Stream end triggered for model ${model}`);
        res.removeListener("close", cleanup);
        this.activeControllers.delete(convId);
        await handleFinalizeAndSendId(true, false);
        resolve();
      });

      stream.on("error", async (err: any) => {
        console.log(`[STREAM ERROR] Error occured in ${model}: ${err.message}`);
        res.removeListener("close", cleanup);
        const isCanceled =
        err.name === "CanceledError" ||
        err.message === "canceled" ||
        err.code === "ERR_CANCELED" ||
        axiosController.signal.aborted;
        if (!isCanceled) {
          console.error("[REAL ERROR]", err);
          if (!res.writableEnded) {
            res.write(`stream: ${JSON.stringify({ event: "error", data: err.message, responseId: placeholderId })}\n\n`);
            res.end();
          }
        }
        if (!isStreamFinished) {
          await handleFinalizeAndSendId(false, !isCanceled);
        }
        resolve();
      });
    });
  }
}