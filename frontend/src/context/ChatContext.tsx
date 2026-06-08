// context/ChatContext.tsx
import React, {
  createContext, useState, useRef, useCallback, type ReactNode
} from "react";

export interface Message {
  id?: number;
  content: string;
  conversationId: number;
  type: string;
  createdAt?: string | Date;
}

export interface Conversation {
  id: number;
  title: string;
  AIModel: string;
  messages?: Message[];
}

type ConvStreamState = {
  liveText: string;
  streaming: boolean;
};

interface ChatContextType {
  currentConversation: Conversation | null;
  setCurrentConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  groupConversations: Conversation[];
  setGroupConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  // live stream state — keyed by conversationId
  streamMap: Map<number, ConvStreamState>;
  setStreamState: (convId: number, state: Partial<ConvStreamState>) => void;
  clearStreamState: (convId: number) => void;
  // finalized messages — keyed by conversationId, survives tab switches
  convMessagesMap: Map<number, Message[]>;
  initConvMessages: (convId: number, messages: Message[]) => void;
  appendMessage: (convId: number, message: Message) => void;
  // abort controllers — one per conversation, stored as a ref (no re-renders)
  abortMapRef: React.MutableRefObject<Map<number, AbortController>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [groupConversations, setGroupConversations] = useState<Conversation[]>([]);
  const [streamMap, setStreamMap] = useState<Map<number, ConvStreamState>>(new Map());
  const [convMessagesMap, setConvMessagesMap] = useState<Map<number, Message[]>>(new Map());
  // Ref so abort operations never trigger re-renders
  const abortMapRef = useRef<Map<number, AbortController>>(new Map());

  const setStreamState = useCallback((convId: number, update: Partial<ConvStreamState>) => {
    setStreamMap(prev => {
      const next = new Map(prev);
      const existing = next.get(convId) ?? { liveText: "", streaming: false };
      next.set(convId, { ...existing, ...update });
      return next;
    });
  }, []);

  const clearStreamState = useCallback((convId: number) => {
    setStreamMap(prev => {
      const next = new Map(prev);
      next.delete(convId);
      return next;
    });
  }, []);

  const initConvMessages = useCallback((convId: number, messages: Message[]) => {
    setConvMessagesMap(prev => {
      // Don't overwrite — background stream may have already appended messages
      if (prev.has(convId)) return prev;
      const next = new Map(prev);
      next.set(convId, messages);
      return next;
    });
  }, []);

  const appendMessage = useCallback((convId: number, message: Message) => {
    setConvMessagesMap(prev => {
      const next = new Map(prev);
      next.set(convId, [...(next.get(convId) ?? []), message]);
      return next;
    });
  }, []);

  return (
    <ChatContext.Provider value={{
      currentConversation, setCurrentConversation,
      groupConversations, setGroupConversations,
      streamMap, setStreamState, clearStreamState,
      convMessagesMap, initConvMessages, appendMessage,
      abortMapRef,
    }}>
      {children}
    </ChatContext.Provider>
  );
};