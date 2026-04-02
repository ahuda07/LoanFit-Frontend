import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiX, FiMenu, FiTrash } from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import logo from "./Logo.png";

export default function Sidebar({
  refreshTrigger,
  onNewChat,
  onSelectChat
}: {
  refreshTrigger?: number;
  onNewChat: () => void;
  onSelectChat?: (sessionId: string, messages: any[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 1000,
          width: "40px",
          height: "40px",
          cursor: "pointer",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen(true)}
      >
        {!hovered && (
          <img
            src={logo}
            alt="Logo"
            style={{ width: "40px", height: "auto", display: "block" }}
          />
        )}

        {hovered && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              color: "white",
              fontSize: "20px",
            }}
          >
            <FiMenu />
          </div>
        )}
      </div>
    );
  }

  // Full sidebar
  return (
    <div
      style={{
        width: "260px",
        height: "100vh",
        backgroundColor: "#313131",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* Logo and close button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <img
          src={logo}
          alt="LoanFit Copilot"
          style={{ width: "40px", height: "auto" }}
        />

        <button
          onClick={() => setOpen(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          <FiX />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px",
          marginBottom: "15px",
          backgroundColor: "#313131",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
          color: "white",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#212121")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#313131")
        }
        onClick={() => {
          setSelectedChat(null); 
          onNewChat();
        }}
      >
        <FiPlus /> New Chat
      </button>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: "6px",
          marginBottom: "15px",
          backgroundColor: "#313131",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#212121")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#313131")
        }
      >
        <FiSearch style={{ marginRight: "6px" }} />
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
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            width: "100%",
            outline: "none",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Chat List */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
        <p style={{ fontSize: "12px", opacity: 0.6, marginBottom: "6px" }}>
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
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                marginBottom: "4px",
                cursor: "pointer",
                fontSize: "14px",
                backgroundColor: isSelected ? "#212121" : isHovered ? "#212121" : "#313131",
                transition: "background 0.2s",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                overflow: "hidden",
              }}
              onClick={() => {
                setSelectedChat(chat.session_id);
                if (onSelectChat) {
                  onSelectChat(chat.session_id, chat.messages || []);
                }
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.title}</span>
              {(isHovered || isSelected) && (
                <FiTrash
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.session_id);
                  }}
                  style={{ cursor: "pointer", marginLeft: "8px", flexShrink: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}