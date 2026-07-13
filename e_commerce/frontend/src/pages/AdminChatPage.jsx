import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { getErrorMessage } from "../utils/getErrorMessage";

function AdminChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch active support threads
  const loadActiveUsers = async () => {
    try {
      const { data } = await api.get("/chat/active-users");
      setActiveUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user?.is_admin) return;
    loadActiveUsers();
  }, [authLoading, user]);

  // Load chat history of selected user
  useEffect(() => {
    if (!selectedUserId || !user?.is_admin) return;

    async function loadHistory() {
      try {
        const { data } = await api.get(`/chat/history/${selectedUserId}`);
        setMessages(data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadHistory();
  }, [selectedUserId, user]);

  // Connect WebSockets
  useEffect(() => {
    if (authLoading || !user?.is_admin) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsProtocol = apiBase.startsWith("https") ? "wss" : "ws";
    const wsHost = apiBase.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProtocol}://${wsHost}/ws/chat?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        // If this message belongs to the currently active conversation, append it
        if (payload.user_id === selectedUserId) {
          setMessages((prev) => [...prev, payload]);
        }
        
        // Reload left panel active users to show correct message snippet
        loadActiveUsers();
      } catch (err) {
        console.error("Support chat socket parse error:", err);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [authLoading, user, selectedUserId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUserId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUserId || !wsRef.current) return;

    const payload = {
      message: text.trim(),
      target_user_id: selectedUserId,
    };

    wsRef.current.send(JSON.stringify(payload));
    setText("");
  };

  // Auth Protection
  if (authLoading) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <p>Loading support profile...</p>
        </div>
      </main>
    );
  }

  if (!user?.is_admin) {
    return (
      <main className="page page-enter">
        <div className="empty-state">
          <div className="empty-icon">🚫</div>
          <h2>Admin access required</h2>
          <p>You do not have permission to view support chat.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page page-enter" style={{ display: "flex", flexDirection: "column", height: "calc(100svh - 120px)" }}>
      <div className="section-header" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
        <h1>Support Chat Console</h1>
        <p>Chat with active store customers in real-time</p>
      </div>

      {error && <p className="form-error page-error">{error}</p>}

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          background: "var(--white)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        {/* Left Side: Users List */}
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", background: "rgba(14, 165, 233, 0.03)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Active Chats ({activeUsers.length})</h3>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading conversations...</p>
            ) : activeUsers.length === 0 ? (
              <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>No active chats</p>
            ) : (
              activeUsers.map((item) => {
                const isSelected = selectedUserId === item.user_id;
                return (
                  <button
                    key={item.user_id}
                    type="button"
                    onClick={() => setSelectedUserId(item.user_id)}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "rgba(14, 165, 233, 0.08)" : "none",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "rgba(14, 165, 233, 0.03)")}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.9rem", color: "var(--text-h)" }}>{item.username}</strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: isSelected ? "var(--text)" : "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0
                      }}
                    >
                      {item.last_message || "No messages"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div style={{ display: "flex", flexDirection: "column", background: "rgba(14, 165, 233, 0.01)" }}>
          {selectedUserId ? (
            <>
              {/* Active Conversation Header */}
              <div
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--white)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--teal)" }} />
                <span style={{ fontWeight: 600, color: "var(--text-h)" }}>
                  {activeUsers.find((u) => u.user_id === selectedUserId)?.username || "Customer"}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  ({activeUsers.find((u) => u.user_id === selectedUserId)?.email})
                </span>
              </div>

              {/* Message History */}
              <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {messages.map((msg) => {
                  const isSupportAdmin = msg.sender_id === user.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isSupportAdmin ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: isSupportAdmin ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                          background: isSupportAdmin ? "var(--gradient-hero)" : "white",
                          color: isSupportAdmin ? "white" : "var(--text-h)",
                          boxShadow: "var(--shadow-sm)",
                          border: isSupportAdmin ? "none" : "1px solid var(--border)",
                          fontSize: "0.95rem",
                          wordBreak: "break-word"
                        }}
                      >
                        {msg.message}
                      </div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          alignSelf: isSupportAdmin ? "flex-end" : "flex-start",
                          marginTop: "0.2rem",
                          padding: "0 0.25rem"
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Reply Input */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "1rem",
                  background: "var(--white)",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: "0.75rem"
                }}
              >
                <input
                  type="text"
                  placeholder="Type a response..."
                  style={{
                    flex: 1,
                    padding: "0.75rem 1.25rem",
                    borderRadius: "999px",
                    border: "1px solid var(--border)",
                    fontSize: "0.95rem",
                    outline: "none"
                  }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "999px"
                  }}
                >
                  Reply
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "3rem" }}>💬</span>
                <h3 style={{ marginTop: "1rem", color: "var(--text-h)" }}>Support Dashboard</h3>
                <p style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>Select a conversation thread from the list to start support</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AdminChatPage;
