import React, {createContext, useState, type ReactNode } from "react";

export interface Message{
    id?: number,
    content: string,
    conversationId: number,
    type: string
}
export interface Conversation{
    id: number,
    title: string,
    AIModel: string,
    messages?: Message[]
}
interface ChatContextType{
    currentConversation: Conversation|null;
    setCurrentConversation: React.Dispatch<React.SetStateAction<Conversation|null>>;
    groupConversations: Conversation[];
    setGroupConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}
export const ChatContext = createContext<ChatContextType|undefined>(undefined);
interface ChatProviderProps {
    children: ReactNode;
}
export const ChatProvider = ({children}:ChatProviderProps) =>{
    const [currentConversation, setCurrentConversation] = useState<Conversation|null>(null);
    const [groupConversations, setGroupConversations] = useState<Conversation[]>([]);
    return(
        <ChatContext.Provider value={{ currentConversation, setCurrentConversation, groupConversations, setGroupConversations }}>
            {children}
        </ChatContext.Provider>
    )
}