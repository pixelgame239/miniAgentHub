import { useState } from "react";
import styles from "../styles/chat.module.css";
import { useLoaderData } from "react-router";
import type { AIModels } from "../loader/aiLoader";

interface Message {
  id: number;
  sender: string;
  text: string;
  timestamp: string;
  isUser: boolean;
  modelName?: string;
  responseTime?: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "You",
    text: "Could you summarize the recent findings from our 'Project Orion' neural architecture research? Focus on the latency improvements in low-power environments.",
    timestamp: "11:42 AM",
    isUser: true,
  },
  {
    id: 2,
    sender: "Agent Hub",
    text: "I've analyzed the 'Project Orion' data. The most significant finding is a **24% reduction in inference latency** for ARM-based processors.\n\n* Implementing adaptive weight pruning.\n* Optimizing memory footprint.\n* Hybrid quantization scheme.",
    timestamp: "11:42 AM",
    isUser: false,
    modelName: "GROQ-LLAMA3-70B",
    responseTime: "1.2s",
  },
];

const ChatPage = () => {
  const aiModels = useLoaderData() as AIModels[];
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] =useState(aiModels[0]||"Not found");
  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newUserMessage: Message = {
      id: Date.now(),
      sender: "You",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isUser: true,
    };

    setMessages((prev) => [
      ...prev,
      newUserMessage,
    ]);

    setInputText("");

    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        sender: "Agent Hub",
        text: "This is a placeholder response to **your query**.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isUser: false,
        modelName: selectedModel.id,
        responseTime: "0.8s",
      };

      setMessages((prev) => [
        ...prev,
        botResponse,
      ]);
    }, 1000);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageText = (text: string) => {
    const lines = text.split("\n");

    return lines.map((line, i) => {
      if (line.startsWith("* ")) {
        return (
          <li
            key={i}
            className={styles.messageBullet}
          >
            {formatInline(line.substring(2))}
          </li>
        );
      }

      if (line.trim() === "") {
        return <br key={i} />;
      }

      return (
        <p
          key={i}
          className={styles.messageParagraph}
        >
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });
  };

  return (
    <div className={styles.chatPage}>
      {/* HEADER */}
      <header className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.logoDot} />

          <div>
            <h2 className={styles.chatTitle}>
              Agent Hub
            </h2>

            <p className={styles.chatSubtitle}>
              AI Collaboration Workspace
            </p>
          </div>
        </div>

        {/* MODEL SELECT */}
        <div className={styles.modelSelector}>
          <label>Model</label>

          <select
            value={selectedModel.id}
            onChange={(e) =>
              setSelectedModel({id: e.target.value})
            }
            className={styles.modelDropdown}
          >
            {aiModels.map((model) => (
              <option
                key={model.id}
                value={model.id}
              >
                {model.id}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* MESSAGES */}
      <div className={styles.chatMessages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${
              msg.isUser
                ? styles.userRow
                : styles.modelRow
            }`}
          >
            <div className={styles.messageBubble}>
              <div className={styles.messageSender}>
                {msg.sender}
              </div>

              <div className={styles.messageText}>
                {msg.isUser
                  ? msg.text
                  : formatMessageText(msg.text)}
              </div>

              {!msg.isUser && msg.modelName && (
                <div className={styles.modelMeta}>
                  <span>{msg.modelName}</span>

                  <span>
                    · Response time:{" "}
                    {msg.responseTime}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.messageTime}>
              {msg.timestamp}
            </div>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className={styles.chatInputWrapper}>
        <div className={styles.chatInputContainer}>
          <button className={styles.attachBtn}>
            +
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) =>
              setInputText(e.target.value)
            }
            onKeyDown={handleKeyDown}
            className={styles.chatInput}
            placeholder="Enter a prompt here..."
          />

          <button
            className={styles.sendBtn}
            onClick={sendMessage}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;