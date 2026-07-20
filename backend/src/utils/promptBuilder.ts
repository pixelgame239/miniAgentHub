import { prisma } from "../../lib/prisma";

export async function buildPromptWithContext(
  convId: number, 
  content: string, 
  currentFileContent: string | null
): Promise<string> {
  const previousContext = await prisma.message.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: "desc" },
    select: { content: true, type: true, fileContent: true },
    take: 10
  });

  const contextText = previousContext.reverse()
    .map(msg => {
      const sender = msg.type === "prompt" ? "User" : "AI";
      if (msg.fileContent) {
        return `${sender}: ${msg.content}\n[Attached File Data]:\n<file_content>\n${msg.fileContent}\n</file_content>`;
      }
      return `${sender}: ${msg.content}`;
    })
    .join("\n");

  let currentMessageText = `User: ${content}`;
  if (currentFileContent) {
    currentMessageText += `\n[Attached File Data]:\n<file_content>\n${currentFileContent}\n</file_content>`;
  }

  return `
  [CHAT HISTORY]
  ${contextText}

  [CURRENT QUESTION]
  ${currentMessageText}
  AI:`;
}