import { useState, useRef } from "react"
import { Mic } from "lucide-react"
import "./ChatBox.css"

export default function ChatHomeInput() {
  const [value, setValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleFileClick = () => {fileInputRef.current?.click()}
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    console.log("Mock upload file:", file.name)
  }
}
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    console.log("User asked:", value)
    setValue("")
  }

  return (
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
  )
}
