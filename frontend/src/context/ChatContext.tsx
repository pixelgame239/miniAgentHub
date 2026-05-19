import React, {createContext, useState, type ReactNode } from "react";

interface UserGroup{
    id:number;
    groupName: string; 
}
interface Conversation{
    id: number,
    title: string,
    AIModel: string,
}
interface ChatContextType{
    userGroups: UserGroup[]|[];
    setUserGroups: React.Dispatch<React.SetStateAction<UserGroup[] | []>>;
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]|[]>>;
}
export const ChatContext = createContext<ChatContextType|undefined>(undefined);
interface ChatProviderProps {
    children: ReactNode;
}
export const ChatProvider = ({children}:ChatProviderProps) =>{
    const [userGroups, setUserGroups] = useState<UserGroup[] | []>([]);
    const [conversations, setConversations] = useState<Conversation[]|[]>([]);
    return(
        <ChatContext.Provider value={{ userGroups, setUserGroups, conversations, setConversations }}>
            {children}
        </ChatContext.Provider>
    )
}