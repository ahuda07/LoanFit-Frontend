import { useState, useRef, useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Mic } from "lucide-react"
import "./ChatBox.css"

export default function ChatHomeInput({
  newChatTrigger,
  activeSessionId,
  initialMessages
}: {
  newChatTrigger: number;
  activeSessionId?: string | null;
  initialMessages?: { role: string, content: string }[];
}) {
  const { getToken } = useAuth()
  const [value, setValue] = useState("")
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
  const [isListening, setIsListening] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setMessages([])
    setValue("")
    setSelectedFile(null)
    setSessionId(null)
  }, [newChatTrigger])

  useEffect(() => {
    if (activeSessionId && initialMessages) {
      setSessionId(activeSessionId)
      setMessages(initialMessages)
      setValue("")
      setSelectedFile(null)
    }
  }, [activeSessionId, initialMessages])

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setValue((prev) => prev + " " + transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      console.log("Mock upload file:", file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return

    const userMessage = value
    setValue("")

    setMessages(prev => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "" }
    ])

    try {
      const token = await getToken()

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_input: userMessage,
          session_id: sessionId
        })
      })

      const newSessionId = response.headers.get("X-Session-ID")
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId)
      }

      const reader = response.body?.getReader()
      if (!reader) return

      let agentMessage = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        agentMessage += new TextDecoder().decode(value)

        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: agentMessage }
          return updated
        })
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error: Could not reach server." }
      ])
    }
  }

  return (
    <div>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === "user" ? "user-msg" : "agent-msg"}
          >
            <b>{msg.role === "user" ? "You" : "Copilot"}:</b> {msg.content}
          </div>
        ))}
      </div>

      <form className="chat-home-container" onSubmit={handleSubmit}>
        <div className={`chat-home-input-wrapper ${selectedFile ? "expanded" : ""}`}>

          {selectedFile && (
            <div className="file-preview-inline">
              <div className="file-icon">PDF</div>

              <div className="file-info">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-type">PDF</div>
              </div>

              <button
                type="button"
                className="remove-file"
                onClick={() => setSelectedFile(null)}
              >
                x
              </button>
            </div>
          )}

          <div className="input-row">
            <button type="button" onClick={handleFileClick}>
              +
            </button>

            <input
              type="text"
              placeholder="Ask anything"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="chat-home-input"
            />

            <button
              type="button"
              className={`icon-button ${isListening ? "listening" : ""}`}
              onClick={handleMicClick}
            >
              <Mic size={18} />
            </button>
          </div>

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