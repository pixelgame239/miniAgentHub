import React, {
  createContext, useState, useRef, useCallback, type ReactNode
} from "react";

export interface Message {
  id?: number;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  conversationId: number;
  type: string;
  createdAt?: string | Date;
  AIModel?: string;
  isCompleted?: boolean;
}

export interface Conversation {
  id: number;
  title: string;
  AIModel: string;
  messages?: Message[];
}

// Stream state per conversation — lives in context so it survives tab switches
export type ConvStreamState = {
  liveText: string;
  streaming: boolean;
};

interface ChatContextType {
  currentConversation: Conversation | null;
  setCurrentConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  groupConversations: Conversation[];
  setGroupConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;

  // Finalized messages, keyed by convId
  convMessagesMap: Map<number, Message[]>;
  initConvMessages: (convId: number, messages: Message[]) => void;
  appendMessage: (convId: number, message: Message) => void;

  // Stream state, keyed by convId — survives tab switches
  streamMap: Map<number, ConvStreamState>;
  setStreamState: (convId: number, patch: Partial<ConvStreamState>) => void;
  clearStreamState: (convId: number) => void;

  // Abort controllers, keyed by convId — stored in a ref so they never
  // trigger re-renders. One controller per conversation, NOT per component.
  abortMapRef: React.RefObject<Map<number, AbortController>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [groupConversations, setGroupConversations] = useState<Conversation[]>([]);
  const [convMessagesMap, setConvMessagesMap] = useState<Map<number, Message[]>>(new Map());
  const [streamMap, setStreamMap] = useState<Map<number, ConvStreamState>>(new Map());

  // One AbortController per conversation — never keyed to a component
  const abortMapRef = useRef<Map<number, AbortController>>(new Map());

  const setStreamState = useCallback((convId: number, patch: Partial<ConvStreamState>) => {
    setStreamMap(prev => {
      const next = new Map(prev);
      const existing = next.get(convId) ?? { liveText: "", streaming: false };
      next.set(convId, { ...existing, ...patch });
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
      convMessagesMap, initConvMessages, appendMessage,
      streamMap, setStreamState, clearStreamState,
      abortMapRef,
    }}>
      {children}
    </ChatContext.Provider>
  );
};