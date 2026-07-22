import { getEncoding } from "js-tiktoken";
import { prisma } from "../../lib/prisma";

const encoder = getEncoding("cl100k_base");

function countTokens(text: string): number {
  return encoder.encode(text).length;
}

export async function buildPromptWithContext(
convId: number,
  content: string,
  currentPromptId: number,
  currentFileContent: string | null,
  maxInputTokens: number = 4096
): Promise<string> {
  let currentMessageText = `User: ${content}`;
  if (currentFileContent) {
    currentMessageText += `\n[Attached File Data]:\n<file_content>\n${currentFileContent}\n</file_content>`;
  }

  const currentQuestionBlock = `\n  [CURRENT QUESTION]\n  ${currentMessageText}\n  AI:`;
  const currentQuestionTokens = countTokens(currentQuestionBlock);
  let remainingHistoryBudget = maxInputTokens - currentQuestionTokens - 100;
  if (remainingHistoryBudget < 0) {
    console.warn("Current question exceeds the maximum token limit. Truncating the question.");
    remainingHistoryBudget = 0;
  }
  const previousContext = await prisma.message.findMany({
    where: { conversationId: convId, id: { not: currentPromptId } },
    orderBy: { createdAt: "desc" },
    select: { content: true, type: true, fileContent: true },
    take: 10
  });

// 3. ĐƯA LỊCH SỬ VÀO PROMPT (Từ mới đến cũ, vượt budget là BỎ LUÔN)
  const safeHistoryMessages: string[] = [];

  for (const msg of previousContext) {
    const sender = msg.type === "prompt" ? "User" : "AI";
    
    const formattedMsg = msg.fileContent
      ? `${sender}: ${msg.content}\n[Attached File Data]:\n<file_content>\n${msg.fileContent}\n</file_content>`
      : `${sender}: ${msg.content}`;

    const msgTokens = countTokens(formattedMsg);

    if (remainingHistoryBudget - msgTokens >= 0) {
      safeHistoryMessages.unshift(formattedMsg);
      remainingHistoryBudget -= msgTokens;
    } else {
      break;
    }
  }

  const contextText = safeHistoryMessages.join("\n");

  // 4. GHÉP PROMPT HOÀN CHỈNH
  return `
  [CHAT HISTORY]
  ${contextText}

  [CURRENT QUESTION]
  ${currentMessageText}
  AI:`;
}