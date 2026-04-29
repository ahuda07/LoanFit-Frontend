import { useState, useRef, useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { ArrowUp, Mic, Volume2, VolumeX, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import "./ChatBox.css"

type Message = {
  role: string
  content: string
  file?: string
  agent_name?: string
}

const API_URL = import.meta.env.VITE_API_URL;

const scrubPII = (text: string) => {
  if (!text) return text;
  let scrubbed = text;
  // Emails
  scrubbed = scrubbed.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED EMAIL]');
  // Credit Cards
  scrubbed = scrubbed.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED CC]');
  // Phone Numbers
  scrubbed = scrubbed.replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED PHONE]');
  // SSNs
  scrubbed = scrubbed.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[REDACTED SSN]');
  return scrubbed;
};

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
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [errorPopup, setErrorPopup] = useState<string | null>(null)

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

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
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
    const scrubbedUserMessage = scrubPII(userMessage)
    setValue("")
    setErrorPopup(null)

    let uiUpdated = false;
    const updateOptimisticUI = () => {
      if (uiUpdated) return;
      uiUpdated = true;
      setMessages((prev) => {
        const lastAgentName = [...prev].reverse().find(m => m.role === "assistant" && m.agent_name)?.agent_name || "LoanFit Copilot";
        return [
          ...prev,
          {
            role: "user",
            content: scrubbedUserMessage,
            file: selectedFile ? selectedFile.name : undefined
          },
          { role: "assistant", content: "", agent_name: lastAgentName }
        ]
      })
    };

    try {
      const token = await getToken()
      const formData = new FormData()

      formData.append("user_input", scrubbedUserMessage)

      if (sessionId) {
        formData.append("session_id", sessionId)
      }

      if (selectedFile) {
        formData.append("file", selectedFile)
      }

      // Delay optimistic UI update slightly to check for instant 429s
      const timeoutId = setTimeout(updateOptimisticUI, 150);

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a minute before making more requests (limit: 30/min).");
        }
        throw new Error("Failed to send message.");
      }

      updateOptimisticUI();

      const newSessionId = response.headers.get("X-Session-ID")
      const agentName = response.headers.get("X-Agent-Name") || "Copilot"

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
            content: agentMessage,
            agent_name: agentName
          }
          return updated
        })
      }

      setSelectedFile(null)
      if (onChatUpdated) {
        onChatUpdated()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred.";
      if (uiUpdated) {
        setMessages((prev) => prev.slice(0, -2));
      }
      setValue(userMessage);
      setErrorPopup(errorMessage);
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
      {errorPopup && (
        <div className="custom-error-popup">
          <div className="custom-error-popup-content">
            <span className="error-icon">⚠️</span>
            <p>{errorPopup}</p>
          </div>
          <button className="custom-error-dismiss" type="button" onClick={() => setErrorPopup(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
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
                  <b>{msg.role === "user" ? "You" : (msg.agent_name || "Copilot")}:</b>
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

                {msg.role === "assistant" && msg.content !== "" && (
                  <button
                    className="copy-button"
                    onClick={() => handleCopy(msg.content, idx)}
                    title="Copy to clipboard"
                  >
                    {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
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
