import { useState, useRef, useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { ArrowUp, Mic, Volume2, VolumeX } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import "./ChatBox.css"

type Message = {
  role: string
  content: string
  file?: string
}

export default function ChatHomeInput({
  newChatTrigger,
  activeSessionId,
  initialMessages,
  userName,
  onChatCreated,
  onChatUpdated
}: {
  newChatTrigger: number;
  activeSessionId?: string | null;
  initialMessages?: { role: string, content: string }[];
  userName?: string;
  onChatCreated?: (sessionId: string) => void;
  onChatUpdated?: () => void;
}) {
  const { getToken } = useAuth()
  const [value, setValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)

  const handleSpeak = (text: string, idx: number) => {
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel()
      setSpeakingIndex(null)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setSpeakingIndex(null)
    utterance.onerror = () => setSpeakingIndex(null)
    setSpeakingIndex(idx)
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    setMessages([])
    setValue("")
    setSelectedFile(null)
    setSessionId(null)
  }, [newChatTrigger])

  useEffect(() => {
    if (activeSessionId && initialMessages && activeSessionId !== sessionId) {
      setSessionId(activeSessionId)
      setMessages(initialMessages)
      setValue("")
      setSelectedFile(null)
    }
  }, [activeSessionId, initialMessages, sessionId])

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" })
  }, [messages])

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

    if (!value.trim() && !selectedFile) return

    const userMessage = value
    setValue("")

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        file: selectedFile ? selectedFile.name : undefined
      },
      { role: "assistant", content: "" }
    ])

    try {
      const token = await getToken()
      const formData = new FormData()

      formData.append("user_input", userMessage)

      if (sessionId) {
        formData.append("session_id", sessionId)
      }

      if (selectedFile) {
        formData.append("file", selectedFile)
      }

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const newSessionId = response.headers.get("X-Session-ID")
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId)
        if (onChatCreated) {
          onChatCreated(newSessionId);
        }
      }

      const reader = response.body?.getReader()
      if (!reader) return

      let agentMessage = ""

      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break

        agentMessage += new TextDecoder().decode(chunk)

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            content: agentMessage
          }
          return updated
        })
      }

      setSelectedFile(null)
      if (onChatUpdated) {
        onChatUpdated()
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: userMessage,
          file: selectedFile?.name
        },
        { role: "assistant", content: "" }
      ])
    }
  }

  const hasMessages = messages.length > 0

  const starterPrompts = [
    "What loan is best for a first-time homebuyer?",
    "Compare fixed vs. adjustable rate mortgages",
    "What can I qualify for with my income?",
    "What's the difference between personal and home loans?",
  ]

  const handleStarterClick = (prompt: string) => {
    setValue(prompt)
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      form?.requestSubmit()
    }, 0)
  }

  return (
    <div className="chat-viewport">
      <div className="chat-content">
        <div className="chat-column">
          <div className="chat-messages">
            {!hasMessages && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                <h1 className="welcome-message" style={{ textAlign: 'center' }}>
                  Welcome Back, {userName || "User"}!
                </h1>
                <div className="starter-chips">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="starter-chip"
                      onClick={() => handleStarterClick(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === "user" ? "user-msg" : "agent-msg"}>
                <div className="msg-header">
                  <b>{msg.role === "user" ? "You" : "Copilot"}:</b>
                  {msg.role === "assistant" && msg.content !== "" && (
                    <button
                      type="button"
                      className="tts-button"
                      onClick={() => handleSpeak(msg.content, idx)}
                      aria-label={speakingIndex === idx ? "Stop speaking" : "Read message aloud"}
                    >
                      {speakingIndex === idx ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                  )}
                </div>

                {msg.file && (
                  <div className="chat-file">
                    File: {msg.file}
                  </div>
                )}

                <div className="markdown-content">
                  {msg.role === "assistant" && msg.content === "" ? (
                    <div className="thinking-indicator">
                      <div className="thinking-dot"></div>
                      <div className="thinking-dot"></div>
                      <div className="thinking-dot"></div>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <form className={hasMessages ? "chat-input-bottom" : "chat-input-center"} onSubmit={handleSubmit}>
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
                <button type="button" onClick={handleFileClick}>+</button>

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

                <button
                  type="submit"
                  className="submit-button"
                  disabled={!value.trim() && !selectedFile}
                  aria-label="Send message"
                >
                  <ArrowUp size={18} />
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
      </div>
    </div>
  )
}
