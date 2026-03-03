import { useState, useRef } from "react"
import { Mic } from "lucide-react"
import "./ChatBox.css"

export default function ChatHomeInput() {
  const [value, setValue] = useState("")
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileClick = () => { fileInputRef.current?.click() }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("Mock upload file:", file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    const userMessage = value;
    setValue(""); // Instantly clear the input

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    // Add a placeholder for the agent's streaming response
    setMessages(prev => [...prev, { role: "agent", content: "" }]);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: userMessage })
      });

      const reader = response.body.getReader();
      let agentMessage = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        agentMessage += new TextDecoder().decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "agent", content: agentMessage };
          return updated;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "agent", content: "Error: Could not reach server." }]);
    }
  };

  return (
    <div>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === "user" ? "user-msg" : "agent-msg"}>
            <b>{msg.role === "user" ? "You" : "Copilot"}:</b> {msg.content}
          </div>
        ))}
      </div>
      <form className="chat-home-container" onSubmit={handleSubmit}>
        <div className="chat-home-input-wrapper">
          <button type="button" onClick={handleFileClick}>+</button>
          <input
            type="text"
            placeholder="Ask anything"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="chat-home-input"
          />
          <button type="button" className="icon-button"><Mic size={18} /></button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept=".pdf"
        />
      </form>
    </div>
  )
}