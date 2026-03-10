import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiX, FiMenu } from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import logo from "./Logo.png";

export default function Sidebar({
  onNewChat,
  onSelectChat
}: {
  onNewChat: () => void;
  onSelectChat?: (sessionId: string, messages: any[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);

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

    // We should fetch when sidebar opens, or listen to newChatTrigger events, but for now fetch on mount
    fetchChats();
  }, [getToken, open]);

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
        onClick={onNewChat}
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

        {chats.map((chat) => (
          <div
            key={chat.session_id}
            onClick={() => {
              if (onSelectChat) {
                onSelectChat(chat.session_id, chat.messages || []);
              }
              console.log("Switching to session:", chat.session_id);
            }}
            style={{
              padding: "8px 10px",
              borderRadius: "6px",
              marginBottom: "4px",
              cursor: "pointer",
              fontSize: "14px",
              backgroundColor: "#313131",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#212121")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#313131")
            }
          >
            {chat.title}
          </div>
        ))}
      </div>
    </div>
  );
}