import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronUp, FiPlus, FiSearch, FiX, FiMenu, FiTrash } from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import { Moon, Sun } from "lucide-react";
import logo from "./Logo.png";
import "./Sidebar.css";

export default function Sidebar({
  refreshTrigger,
  onNewChat,
  onSelectChat,
  theme,
  onToggleTheme,
  fontSize,
  onFontSizeChange
}: {
  refreshTrigger?: number;
  onNewChat: () => void;
  onSelectChat?: (sessionId: string, messages: any[]) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  fontSize: "small" | "medium" | "large";
  onFontSizeChange: (value: "small" | "medium" | "large") => void;
}) {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { getToken } = useAuth();
  const [chats, setChats] = useState<{ session_id: string; title: string; updated_at: string; messages?: any[] }[]>([]);

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
        if (selectedChat === sessionId) {
          setSelectedChat(null);
          onNewChat();
        }
      } else {
        console.error("Failed to delete chat");
      }
    } catch (err) {
      console.error("Error deleting chat", err);
    }
  };

  // Filter chats by search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Search */}
      <div
        className="sidebar-search"
      >
        <FiSearch className="sidebar-search-icon" />
        <input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredChats.length > 0) {
              const chat = filteredChats[0];
              setSelectedChat(chat.session_id);
              if (onSelectChat) {
                onSelectChat(chat.session_id, chat.messages || []);
              }
              setSearchQuery("");
            }
          }}
          className="sidebar-search-input"
        />
      </div>

      {/* Chat List */}
      <div className="sidebar-chat-list">
        <p className="sidebar-chat-heading">
          Your Chats
        </p>

        {filteredChats.map((chat) => {
          const isSelected = selectedChat === chat.session_id;
          const isHovered = hoveredChat === chat.session_id;

          return (
            <div
              key={chat.session_id}
              onMouseEnter={() => setHoveredChat(chat.session_id)}
              onMouseLeave={() => setHoveredChat(null)}
              className={`sidebar-chat-item ${isSelected || isHovered ? "selected" : ""}`}
              onClick={() => {
                setSelectedChat(chat.session_id);
                if (onSelectChat) {
                  onSelectChat(chat.session_id, chat.messages || []);
                }
              }}
            >
              <span className="sidebar-chat-title">{chat.title}</span>
              {(isHovered || isSelected) && (
                <FiTrash
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.session_id);
                  }}
                  className="sidebar-trash"
                />
              )}
            </div>
          );
        })}
      </div>

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
