import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUIStore } from "../store/uiStore";
import api from "../api/axios";
import { getErrorMessage } from "../utils/getErrorMessage";
import { ChatIcon } from "./Icons";
import ErrorBoundary from "./ErrorBoundary";

function SupportChatDrawerContent() {
  const { user, isAuthenticated } = useAuth();
  const { isDrawerOpen, activeTab, closeDrawer } = useUIStore();

  const [supportText, setSupportText] = useState("");
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportError, setSupportError] = useState("");
  const supportMessagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Scroll to bottom on updates
  useEffect(() => {
    if (activeTab === "chat" && isDrawerOpen) {
      supportMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [supportMessages, activeTab, isDrawerOpen]);

  // Load support chat history when drawer opens & Live tab active
  useEffect(() => {
    if (!isAuthenticated || user?.is_admin || activeTab !== "chat" || !isDrawerOpen) return;

    async function loadSupportHistory() {
      try {
        const { data } = await api.get("/chat/history");
        setSupportMessages(data);
      } catch (err) {
        setSupportError(getErrorMessage(err));
      }
    }
    loadSupportHistory();
  }, [isAuthenticated, user, activeTab, isDrawerOpen]);

  // Handle WebSocket Connection for Support Chat
  useEffect(() => {
    if (!isAuthenticated || user?.is_admin || activeTab !== "chat" || !isDrawerOpen) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

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
        if (payload.user_id === user.id) {
          setSupportMessages((prev) => [...prev, payload]);
        }
      } catch (err) {
        console.error("Support socket error:", err);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, user, activeTab, isDrawerOpen]);

  if (!isDrawerOpen || activeTab !== "chat" || !isAuthenticated || user?.is_admin) return null;

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportText.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ message: supportText.trim() }));
    setSupportText("");
  };

  return (
    <>
      {/* Backdrop */}
      <div className="help-drawer-backdrop" onClick={closeDrawer} />

      {/* Drawer Container */}
      <div className="help-drawer-content" style={{ fontFamily: "var(--font)" }}>
        {/* Header Title */}
        <div 
          style={{ 
            padding: "1.25rem", 
            borderBottom: "1px solid var(--border)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>
            Live Customer Support
          </h3>
          <button 
            type="button" 
            onClick={closeDrawer} 
            style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Live Support Chat Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", background: "rgba(14, 165, 233, 0.01)" }}>
            {supportError && <p className="form-error" style={{ fontSize: "0.8rem" }}>{supportError}</p>}
            {supportMessages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                👋 Hi! Send a message below to start chatting with our customer support team.
              </div>
            ) : (
              supportMessages.map((msg) => {
                const isAdmin = msg.sender_id !== user.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isAdmin ? "flex-start" : "flex-end",
                      maxWidth: "80%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.65rem 0.95rem",
                        borderRadius: isAdmin ? "14px 14px 14px 2px" : "14px 14px 2px 14px",
                        background: isAdmin ? "white" : "var(--gradient-hero)",
                        color: isAdmin ? "var(--text-h)" : "white",
                        boxShadow: "var(--shadow-sm)",
                        border: isAdmin ? "1px solid var(--border)" : "none",
                        fontSize: "0.88rem",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.message}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", alignSelf: isAdmin ? "flex-start" : "flex-end", marginTop: "0.15rem", padding: "0 0.25rem" }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={supportMessagesEndRef} />
          </div>

          {/* Support Input Form */}
          <form 
            onSubmit={handleSupportSubmit} 
            style={{ padding: "0.85rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem" }}
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={supportText}
              onChange={(e) => setSupportText(e.target.value)}
              style={{
                flex: 1,
                padding: "0.6rem 0.95rem",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                fontSize: "0.88rem",
                outline: "none",
                color: "var(--text-h)",
                background: "var(--white)"
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "0.6rem 1.2rem",
                fontSize: "0.85rem",
                borderRadius: "999px",
                border: "none"
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function SupportChatDrawer() {
  return (
    <ErrorBoundary>
      <SupportChatDrawerContent />
    </ErrorBoundary>
  );
}

export default SupportChatDrawer;
