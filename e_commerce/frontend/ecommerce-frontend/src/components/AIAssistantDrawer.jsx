import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUIStore } from "../store/uiStore";
import { useChat } from "../hooks/useChat";
import { SparklesIcon, BookOpenIcon } from "./Icons";
import ErrorBoundary from "./ErrorBoundary";

function AIAssistantDrawerContent() {
  const { user, isAuthenticated } = useAuth();
  const { isDrawerOpen, activeTab, closeDrawer } = useUIStore();
  const navigate = useNavigate();

  const [aiText, setAiText] = useState("");
  const aiMessagesEndRef = useRef(null);
  const { 
    messages: aiMessages, 
    sendMessage: sendAiMessage, 
    isGenerating: isAiGenerating, 
    error: aiError, 
    citations 
  } = useChat();

  // Scroll to bottom on updates
  useEffect(() => {
    if (activeTab === "ai" && isDrawerOpen) {
      aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, activeTab, isDrawerOpen]);

  if (!isDrawerOpen || activeTab !== "ai" || !isAuthenticated || user?.is_admin) return null;

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiText.trim() || isAiGenerating) return;
    sendAiMessage(aiText.trim());
    setAiText("");
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
            AI Shopping Assistant
          </h3>
          <button 
            type="button" 
            onClick={closeDrawer} 
            style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* AI Assistant Chat Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", background: "rgba(20, 184, 166, 0.01)" }}>
            {aiMessages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div 
                  key={index} 
                  style={{ 
                    alignSelf: isAssistant ? "flex-start" : "flex-end", 
                    maxWidth: "85%", 
                    display: "flex", 
                    flexDirection: "column" 
                  }}
                >
                  <div 
                    style={{
                      padding: "0.65rem 0.95rem",
                      borderRadius: isAssistant ? "14px 14px 14px 2px" : "14px 14px 2px 14px",
                      background: isAssistant ? "white" : "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
                      color: isAssistant ? "var(--text-h)" : "white",
                      boxShadow: "var(--shadow-sm)",
                      border: isAssistant ? "1px solid var(--border)" : "none",
                      fontSize: "0.88rem",
                      lineHeight: "1.4"
                    }}
                  >
                    {msg.content === "" && isAiGenerating && index === aiMessages.length - 1 ? (
                      <span style={{ fontStyle: "italic", opacity: 0.75 }}>Thinking...</span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Product Citations */}
            {citations && citations.length > 0 && (
              <div style={{ padding: "0.75rem", background: "rgba(14, 165, 233, 0.05)", borderRadius: "8px", border: "1px solid rgba(14, 165, 233, 0.1)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Matches found in catalog:</span>
                <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
                  {citations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        closeDrawer();
                        navigate(`/products/${c.id}`);
                      }}
                      style={{
                        background: "white",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <BookOpenIcon size={12} color="var(--ocean)" />
                        <strong>{c.name}</strong> - Rs.{c.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graceful Degradation Fallback UI */}
            {aiError && (
              <div 
                style={{ 
                  padding: "0.85rem", 
                  background: "rgba(239, 68, 68, 0.04)", 
                  border: "1px solid rgba(239, 68, 68, 0.15)", 
                  borderRadius: "8px", 
                  fontSize: "0.82rem", 
                  color: "#e11d48"
                }}
                data-testid="graceful-degradation-ui"
              >
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>⚠️ Assistant Busy</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  AI services are currently busy. Please switch to support chat or try again shortly.
                </div>
              </div>
            )}
            <div ref={aiMessagesEndRef} />
          </div>

          {/* AI Input Form */}
          <form 
            onSubmit={handleAiSubmit} 
            style={{ padding: "0.85rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem" }}
          >
            <input
              type="text"
              placeholder="Ask me anything..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              disabled={isAiGenerating}
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
              disabled={isAiGenerating || !aiText.trim()}
              style={{
                padding: "0.6rem 1.2rem",
                fontSize: "0.85rem",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
                border: "none"
              }}
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function AIAssistantDrawer() {
  return (
    <ErrorBoundary>
      <AIAssistantDrawerContent />
    </ErrorBoundary>
  );
}

export default AIAssistantDrawer;
