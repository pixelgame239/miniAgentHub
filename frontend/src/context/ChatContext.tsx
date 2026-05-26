import React, {createContext, useState, type ReactNode } from "react";

interface UserGroup{
    id:number;
    groupName: string; 
}
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
    userGroups: UserGroup[];
    setUserGroups: React.Dispatch<React.SetStateAction<UserGroup[]>>;
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
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation|null>(null);
    const [groupConversations, setGroupConversations] = useState<Conversation[]>([]);
    return(
        <ChatContext.Provider value={{ userGroups, setUserGroups, currentConversation, setCurrentConversation, groupConversations, setGroupConversations }}>
            {children}
        </ChatContext.Provider>
    )
}