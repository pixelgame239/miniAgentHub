// Sidebar.tsx
import { NavLink, useRouteLoaderData } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/authHook";
import styles from "../styles/sidebar.module.css";
import type { Group } from "../loader/groupLoader";
import { useChat } from "../hooks/chatHook";
import { getConversationDetail, getConversations } from "../api/conversationApi";
import type { Conversation } from "../context/ChatContext";

const Sidebar = ({}) => {
  const userGroups = useRouteLoaderData("group-conversations") as Group[];
  const { setUserGroups, currentConversation, setCurrentConversation } = useChat();
  const [groupConversations, setGroupConversations] = useState<Conversation[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number|null>(null);
  const openConversation = async(convId:number) =>{
    try{
      const response = await getConversationDetail(convId);
      if(response&&response.data){
        setCurrentConversation(response.data);
      }
    } catch(err){
      console.error(err);
    }
  }
  const openGroup = async(groupId:number) =>{
    try{
      setSelectedGroup(groupId);
      const response = await getConversations(groupId);
      if(response&&response.data){
        setGroupConversations(response.data);
      }
    } catch(err){
      console.error(err);
    }
  }
  useEffect(() => {
    if (userGroups) {
      setUserGroups(userGroups);
    }
  }, [userGroups, setUserGroups]);
  const { user } = useAuth();

  const navItems = [
    {
      to: "/chat",
      label: "Chat",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: "/user",
      label: "Users",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      to: "/groups",
      label: "Groups",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3z" />
        </svg>
      ),
    },
    {
      to: "/settings",
      label: "Settings",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82V9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l-.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className={styles.sidebar}>
      {/* HEADER */}
      <header className={styles.sidebarHeader}>
        <div className={styles.appTitle}>
          <span className={styles.appIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>

          <span className={styles.appName}>Agent Hub</span>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className={styles.sidebarNav}>
        {user &&
          navItems
            .filter((item) => {
              if (user.userRole === "ADMIN") return true;
              return item.label !== "Users" && item.label !== "Groups";
            })
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${
                    isActive ? styles.navItemActive : ""
                  }`
                }
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            ))}
      </nav>

      <div className={styles.sidebarDivider} />

      {/* GROUPS / CHATS */}
      <div className={styles.recentChats}>
        {!selectedGroup ? (
          <>
            <div className={styles.groupHeader}>
              <h3 className={styles.recentChatsTitle}>
                Conversations
              </h3>
            </div>

            <div className={styles.groupList}>
              <button
                className={styles.privateButton}
                onClick={async() => {
                  await openGroup(-1);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                </svg>

                Private Conversations
              </button>

              {userGroups
                .map((group) => (
                  <button
                    key={group.id}
                    className={styles.groupItem}
                    onClick={async() => await openGroup(group.id)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                    </svg>

                    {group.groupName}
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            {/* GROUP HEADER */}
            <div className={styles.groupTopBar}>
              <button
                className={styles.backButton}
                onClick={() => setSelectedGroup(null)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>

                Back
              </button>

              <button className={styles.newConversationBtn}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>

                New Chat
              </button>
            </div>
            {/* CHATS */}
            {groupConversations.length>0?
              <div className={styles.chatList}>
              {currentConversation&&currentConversation.messages&& currentConversation.messages.map((chat) => (
                <button
                  key={chat.id}
                  className={`${styles.chatItem} ${
                    currentConversation.id === chat.id
                      ? styles.chatItemActive
                      : ""
                  }`}
                  onClick={async() => await openConversation(chat.id)}
                >
                  <span className={styles.chatItemTitle}>
                    {currentConversation.title}
                  </span>
                </button>
              ))}
            </div>
            :<h3>No conversations</h3>
            }
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.fullname}
            </span>

            <span className={styles.userRole}>
              {user?.userRole}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;