import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Point this at your deployed backend URL (e.g. Render) when you deploy.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://chat-application-x4z1.onrender.com";

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [username, setUsername] = useState(
    () => localStorage.getItem("chat-username") || ""
  );
  const [nameInput, setNameInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Connect once the user has picked a username
  useEffect(() => {
    if (!username) return;

    // Load chat history first
    fetch(`${SERVER_URL}/api/messages`)
      .then((res) => res.json())
      .then((history) => setMessages(history))
      .catch((err) => console.error("Failed to load history:", err));

    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", username);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("chat message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("system message", (text) => {
      setMessages((prev) => [
        ...prev,
        { id: `sys-${Date.now()}`, system: true, text, timestamp: new Date().toISOString() },
      ]);
    });

    socket.on("typing", (name) => {
      setTypingUser(name);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(""), 2000);
    });

    return () => socket.disconnect();
  }, [username]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    localStorage.setItem("chat-username", trimmed);
    setUsername(trimmed);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("chat message", { user: username, text });
    setText("");
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socketRef.current?.emit("typing", username);
  };

  if (!username) {
    return (
      <div className="join-screen">
        <form onSubmit={handleJoin} className="join-form">
          <h1>Simple Chat</h1>
          <p>Pick a username to join</p>
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
          />
          <button type="submit">Join Chat</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-app">
      <header className="chat-header">
        <h1>Simple Chat</h1>
        <span className={`status ${connected ? "online" : "offline"}`}>
          {connected ? "● Online" : "● Connecting..."}
        </span>
      </header>

      <div className="messages">
        {messages.map((m) =>
          m.system ? (
            <div key={m.id} className="system-message">
              {m.text}
            </div>
          ) : (
            <div
              key={m.id}
              className={`message ${m.user === username ? "own" : "other"}`}
            >
              <div className="message-meta">
                <span className="message-user">{m.user}</span>
                <span className="message-time">{formatTime(m.timestamp)}</span>
              </div>
              <div className="message-text">{m.text}</div>
            </div>
          )
        )}
        {typingUser && typingUser !== username && (
          <div className="typing-indicator">{typingUser} is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <input
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
          autoFocus
        />
        <button type="submit" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
