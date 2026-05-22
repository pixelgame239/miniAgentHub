import { useState } from "react";
import styles from "../styles/chat.module.css";
import { useLoaderData } from "react-router";
import type { AIModels } from "../loader/aiLoader";
import { useChat } from "../hooks/chatHook";
import { createConversation } from "../api/conversationApi";

const ChatPage = () => {
  const aiModels = useLoaderData() as AIModels[];
  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] =useState(aiModels[0]||"Not found");
  const { currentConversation, setCurrentConversation } = useChat();

  const sendMessage = async() => {
    if (!inputText.trim()) return;
    try{
      if(!currentConversation){
        const createResponse = await createConversation(inputText);
        if(createResponse.status===201){
          
        }
      }
    }catch(err){
      console.error(err);
    }
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
        {currentConversation&&currentConversation.messages&&currentConversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${
              msg.type==="prompt"
                ? styles.userRow
                : styles.modelRow
            }`}
          >
            <div className={styles.messageBubble}>
              <div className={styles.messageSender}>
                {msg.type==="prompt"?"You":"AI Response"}
              </div>

              <div className={styles.messageText}>
                {msg.type==="prompt"
                  ? msg.content
                  : formatMessageText(msg.content)}
              </div>
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