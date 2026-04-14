import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiChevronUp, FiPlus, FiSearch, FiX, FiMenu, FiTrash, FiShare2 } from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import { Moon, Sun } from "lucide-react";
import logo from "./Logo.png";
import "./Sidebar.css";

type ChatSession = {
  session_id: string;
  title: string;
  updated_at: string;
  messages?: any[];
};

const parseChatTimestamp = (timestamp: string) => {
  const trimmed = timestamp.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(trimmed);
  return new Date(hasTimezone ? trimmed : `${trimmed}Z`);
};

export default function Sidebar({
  refreshTrigger,
  onNewChat,
  activeSessionId,
  onSelectChat,
  theme,
  onToggleTheme,
  fontSize,
  onFontSizeChange
}: {
  refreshTrigger?: number;
  onNewChat: () => void;
  activeSessionId?: string | null;
  onSelectChat?: (sessionId: string, messages: any[]) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  fontSize: "small" | "medium" | "large";
  onFontSizeChange: (value: "small" | "medium" | "large") => void;
}) {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [openChatMenu, setOpenChatMenu] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const { getToken } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const chatMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedChat(activeSessionId ?? null);
  }, [activeSessionId]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) {
        setOpenChatMenu(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  // Fetch historical chats on mount
  useEffect(() => {
    async function fetchChats() {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch("http://localhost:8000/api/chats", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setChats(data.sessions || []);
        }
      } catch (err) {
        console.error("Failed to fetch chats", err);
      }
    }

    fetchChats();
  }, [getToken, open, refreshTrigger]);

  // Delete chat function
  const handleDeleteChat = async (sessionId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/chats/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setChats(prev => prev.filter(c => c.session_id !== sessionId));
        if (selectedChat === sessionId || activeSessionId === sessionId) {
          setSelectedChat(null);
          onNewChat();
        }
        if (hoveredChat === sessionId) {
          setHoveredChat(null);
        }
        if (openChatMenu === sessionId) {
          setOpenChatMenu(null);
        }
      } else {
        console.error("Failed to delete chat");
      }
    } catch (err) {
      console.error("Error deleting chat", err);
    }
  };

  const handleSelectChat = (chat: ChatSession) => {
    setSelectedChat(chat.session_id);
    setSearchOpen(false);
    setSearchQuery("");
    if (onSelectChat) {
      onSelectChat(chat.session_id, chat.messages || []);
    }
  };

  const now = Date.now();
  const recentWindowMs = 24 * 60 * 60 * 1000;
  const pastWeekWindowMs = 7 * 24 * 60 * 60 * 1000;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const recentChats = chats.filter((chat) => {
    const updatedTime = parseChatTimestamp(chat.updated_at).getTime();
    return Number.isFinite(updatedTime) && now - updatedTime <= recentWindowMs;
  });

  const pastWeekChats = chats.filter((chat) => {
    const updatedTime = parseChatTimestamp(chat.updated_at).getTime();
    const age = now - updatedTime;
    return Number.isFinite(updatedTime) && age > recentWindowMs && age <= pastWeekWindowMs;
  });

  const filterByQuery = (items: ChatSession[]) =>
    normalizedQuery
      ? items.filter((chat) => chat.title.toLowerCase().includes(normalizedQuery))
      : items;

  const filteredRecentChats = filterByQuery(recentChats);
  const filteredPastWeekChats = filterByQuery(pastWeekChats);
  const allSearchResults = normalizedQuery
    ? chats.filter((chat) => chat.title.toLowerCase().includes(normalizedQuery))
    : [];

  const formatChatTime = (timestamp: string) => {
    const date = parseChatTimestamp(timestamp);
    if (!Number.isFinite(date.getTime())) {
      return "";
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const renderSearchSection = (label: string, sectionChats: ChatSession[]) => (
    <section className="search-modal-section">
      <p className="search-modal-heading">{label}</p>
      {sectionChats.length > 0 ? (
        <div className="search-modal-results">
          {sectionChats.map((chat) => (
            <button
              key={chat.session_id}
              type="button"
              className="search-modal-item"
              onClick={() => handleSelectChat(chat)}
            >
              <span className="search-modal-item-title">{chat.title}</span>
              <span className="search-modal-item-time">{formatChatTime(chat.updated_at)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="search-modal-empty">
          {normalizedQuery ? "No matching chats in this section." : "No chats in this section yet."}
        </p>
      )}
    </section>
  );

  // Collapsed view
  if (!open) {
    return (
      <div
        className="sidebar-collapsed-trigger"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen(true)}
      >
        {!hovered && (
          <img
            src={logo}
            alt="Logo"
            className="sidebar-collapsed-logo"
          />
        )}

        {hovered && (
          <div className="sidebar-collapsed-icon">
            <FiMenu />
          </div>
        )}
      </div>
    );
  }

  // Full sidebar
  return (
    <div className="sidebar">
      {/* Logo and close button */}
      <div className="sidebar-header">
        <img
          src={logo}
          alt="LoanFit Copilot"
          className="sidebar-logo"
        />

        <button
          onClick={() => setOpen(false)}
          className="sidebar-icon-button"
        >
          <FiX />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        className="sidebar-action-button"
        onClick={() => {
          setSelectedChat(null); 
          onNewChat();
        }}
      >
        <FiPlus /> New Chat
      </button>

      <button
        type="button"
        className="sidebar-action-button"
        onClick={() => setSearchOpen(true)}
      >
        <FiSearch /> Search Chats
      </button>

      {/* Chat List */}
      <div className="sidebar-chat-list">
        <p className="sidebar-chat-heading">
          Your Chats
        </p>

        {chats.map((chat) => {
          const isSelected = selectedChat === chat.session_id;
          const isHovered = hoveredChat === chat.session_id;

          return (
            <div
              key={chat.session_id}
              onMouseEnter={() => setHoveredChat(chat.session_id)}
              onMouseLeave={() => setHoveredChat(null)}
              className={`sidebar-chat-item ${isSelected || isHovered ? "selected" : ""}`}
              onClick={() => handleSelectChat(chat)}
            >
              <span className="sidebar-chat-title">{chat.title}</span>
              {(isHovered || isSelected || openChatMenu === chat.session_id) && (
                <div
                  className="sidebar-chat-actions"
                  ref={openChatMenu === chat.session_id ? chatMenuRef : null}
                >
                  <button
                    type="button"
                    className="sidebar-chat-menu-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenChatMenu((current) => current === chat.session_id ? null : chat.session_id);
                    }}
                    aria-label="Open chat actions"
                    aria-expanded={openChatMenu === chat.session_id}
                  >
                    <span className="sidebar-chat-menu-dots">...</span>
                  </button>

                  {openChatMenu === chat.session_id && (
                    <div className="sidebar-chat-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="sidebar-chat-menu-item"
                        onClick={() => setOpenChatMenu(null)}
                      >
                        <FiShare2 />
                        <span>Share</span>
                      </button>
                      <button
                        type="button"
                        className="sidebar-chat-menu-item danger"
                        onClick={() => setChatToDelete(chat.session_id)}
                      >
                        <FiTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {chatToDelete && (
        <div className="search-modal-overlay" onClick={() => setChatToDelete(null)}>
          <div
            className="search-modal delete-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-title"
          >
            <div className="search-modal-header delete-modal-header">
              <h2 id="delete-chat-title" className="search-modal-title delete-modal-title">Delete Chat?</h2>
            </div>
            
            <div className="search-modal-body delete-modal-body">
              <p className="delete-modal-text">Are you sure you want to delete this chat?</p>
              <div className="delete-modal-actions">
                <button
                  type="button"
                  onClick={() => setChatToDelete(null)}
                  className="delete-modal-button cancel"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteChat(chatToDelete);
                    setChatToDelete(null);
                  }}
                  className="delete-modal-button confirm"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="search-modal-overlay" onClick={() => setSearchOpen(false)}>
          <div
            className="search-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-chats-title"
          >
            <div className="search-modal-header">
              <h2 id="search-chats-title" className="search-modal-title">Search Chats</h2>
              <button
                type="button"
                className="search-modal-close"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <FiX />
              </button>
            </div>

            <div className="search-modal-input-wrapper">
              <FiSearch className="search-modal-input-icon" />
              <input
                autoFocus
                type="text"
                placeholder="Search your chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-modal-input"
              />
            </div>

            <div className="search-modal-body">
              {normalizedQuery ? (
                renderSearchSection("Search Results", allSearchResults)
              ) : (
                <>
                  {renderSearchSection("Recent Chats", filteredRecentChats)}
                  {renderSearchSection("Past 7 Days", filteredPastWeekChats)}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-settings">
        <button
          type="button"
          className="sidebar-settings-toggle"
          onClick={() => setSettingsOpen((prev) => !prev)}
          aria-expanded={settingsOpen}
          aria-controls="sidebar-accessibility-panel"
        >
          <span className="sidebar-settings-label">Accessibility</span>
          <span className="sidebar-settings-chevron">
            {settingsOpen ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>

        {settingsOpen && (
          <div id="sidebar-accessibility-panel" className="sidebar-settings-panel">
            <div className="sidebar-settings-row">
              <span className="sidebar-settings-name">Text size</span>
              <div className="sidebar-font-size-controls" role="group" aria-label="Font size">
                <button
                  type="button"
                  className={`sidebar-font-size-button ${fontSize === "small" ? "active" : ""}`}
                  onClick={() => onFontSizeChange("small")}
                  aria-pressed={fontSize === "small"}
                >
                  S
                </button>
                <button
                  type="button"
                  className={`sidebar-font-size-button ${fontSize === "medium" ? "active" : ""}`}
                  onClick={() => onFontSizeChange("medium")}
                  aria-pressed={fontSize === "medium"}
                >
                  M
                </button>
                <button
                  type="button"
                  className={`sidebar-font-size-button ${fontSize === "large" ? "active" : ""}`}
                  onClick={() => onFontSizeChange("large")}
                  aria-pressed={fontSize === "large"}
                >
                  L
                </button>
              </div>
            </div>

            <div className="sidebar-settings-row">
              <span className="sidebar-settings-name">Theme</span>
              <button
                type="button"
                className="sidebar-theme-toggle"
                onClick={onToggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
