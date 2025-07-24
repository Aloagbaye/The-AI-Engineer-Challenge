import { useState, useRef } from "react";
import styles from "./page.module.css";

export default function ChatPage() {
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [developerMessage, setDeveloperMessage] = useState("Hello! How can I help you today?");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || !apiKey.trim()) return;
    setIsLoading(true);
    setStreamedResponse("");
    setChatHistory((prev) => [...prev, `You: ${userMessage}`]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model,
          api_key: apiKey,
        }),
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        result += chunk;
        setStreamedResponse(result);
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      setChatHistory((prev) => [...prev, `AI: ${result}`]);
      setUserMessage("");
    } catch (err: any) {
      setStreamedResponse("");
      setChatHistory((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.chatContainer}>
        <h1>OpenAI Chat</h1>
        <div className={styles.chatHistory}>
          {chatHistory.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
          {isLoading && (
            <div className={styles.streaming}>{streamedResponse || "..."}</div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form className={styles.inputArea} onSubmit={handleSend}>
          <div className={styles.inputRow}>
            <textarea
              placeholder="Type your message..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              rows={2}
              required
            />
          </div>
          <div className={styles.inputRow}>
            <input
              type="password"
              placeholder="OpenAI API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>
          </div>
          {/* Hidden developer message, could be exposed if needed */}
          <input
            type="hidden"
            value={developerMessage}
            onChange={(e) => setDeveloperMessage(e.target.value)}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
        <div style={{ fontSize: "0.9em", opacity: 0.7, marginTop: 8 }}>
          Your API key is never stored. Powered by OpenAI.
        </div>
      </main>
    </div>
  );
}
