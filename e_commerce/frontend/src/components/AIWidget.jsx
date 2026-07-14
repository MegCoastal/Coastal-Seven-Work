import React from "react";
import { useAuth } from "../context/AuthContext";
import { useUIStore } from "../store/uiStore";
import { AIAssistantIcon } from "./Icons";

function AIWidget() {
  const { user, isAuthenticated } = useAuth();
  const openDrawer = useUIStore((state) => state.openDrawer);
  const isDrawerOpen = useUIStore((state) => state.isDrawerOpen);
  const activeTab = useUIStore((state) => state.activeTab);

  // Render only for authenticated regular customers (not admins)
  if (!isAuthenticated || user?.is_admin) return null;

  // Hide the floating widget if the assistant drawer is already open
  if (isDrawerOpen && activeTab === "ai") return null;

  return (
    <button
      type="button"
      className="ai-floating-widget"
      onClick={() => openDrawer("ai")}
      aria-label="Open AI Shopping Assistant"
    >
      <AIAssistantIcon size={26} />
      <span className="ai-widget-tooltip">AI Assistant ✨</span>
    </button>
  );
}

export default AIWidget;
