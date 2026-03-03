import { useState } from "react";
import { FiPlus, FiSearch, FiX } from "react-icons/fi";
import logo from "./Logo.png";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  const chats = [
    "John",
    "Matt",
    "Chris",
    "Jacob",
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 1000,
          padding: "10px",
          borderRadius: "6px",
          backgroundColor: "#313131",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        ☰
      </button>
    );
  }

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
        {/* Logo */}
        <img
          src={logo}
          alt="LoanFit Copilot"
          style={{ width: "40px", height: "auto" }}
        />

        {/* Close sidebar */}
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
      >
      <FiPlus /> New Chat
      </button>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
        //   backgroundColor: "#212121",
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
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        <p style={{ fontSize: "12px", opacity: 0.6, marginBottom: "6px" }}>
          Your Chats
        </p>
        {chats.map((chat, idx) => (
          <div
            key={idx}
            style={{
              padding: "8px 10px",
              borderRadius: "6px",
              marginBottom: "4px",
              cursor: "pointer",
              fontSize: "14px",
              backgroundColor: "#313131",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#212121")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#313131")
            }
          >
            {chat}
          </div>
        ))}
      </div>
    </div>
  );
}
