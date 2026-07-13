import { useState, useRef, useEffect } from "react";
import { getErrorMessage } from "../utils/getErrorMessage";

export function useChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Aloha! I am the WaveMart AI Shopping Assistant. How can I help you choose the right products or answer your shopping questions today?",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [citations, setCitations] = useState([]);

  const queueRef = useRef(""); // Buffer for incoming streamed characters
  const timerRef = useRef(null); // Ref for typewriter loop timer

  // Stop typing loop on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || isGenerating) return;

    setError("");
    setIsGenerating(true);
    setCitations([]); // Clear previous citations

    const userMessage = { role: "user", content: text.trim() };
    
    // Add user message and empty placeholder for assistant response
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    
    queueRef.current = ""; // Reset typewriter buffer

    // Start Typewriter loop: writes characters from the buffer queue to the UI
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (queueRef.current.length > 0) {
        // Grab the next character from the queue
        const nextChar = queueRef.current.charAt(0);
        queueRef.current = queueRef.current.slice(1);

        setMessages((prev) => {
          const copy = [...prev];
          const lastMsg = copy[copy.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content += nextChar;
          }
          return copy;
        });
      }
    }, 15); // Print a character every 15ms

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiBase}/ai/rag/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            userMessage,
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                // If backend yields error payload, stop typing and show it
                if (timerRef.current) clearInterval(timerRef.current);
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1].content = `⚠️ ${parsed.error}`;
                  return copy;
                });
                return;
              }
              if (parsed.citations) {
                // Capture retrieved RAG catalog sources
                setCitations(parsed.citations);
              }
              if (parsed.text) {
                // Feed chunk text into character queue buffer
                queueRef.current += parsed.text;
              }
            } catch (err) {
              console.error("FTS parser exception:", err);
            }
          }
        }
      }

      // Wait until the typewriter finishes printing the remaining characters
      // before setting isGenerating back to false
      const checkFinishedInterval = setInterval(() => {
        if (queueRef.current.length === 0) {
          clearInterval(checkFinishedInterval);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsGenerating(false);
        }
      }, 100);

    } catch (err) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const errMsg = getErrorMessage(err);
      setError(errMsg);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1].content = `⚠️ Connection error: ${errMsg}. Please try again.`;
        return copy;
      });
      setIsGenerating(false);
    }
  };

  return {
    messages,
    sendMessage,
    isGenerating,
    error,
    citations,
  };
}
