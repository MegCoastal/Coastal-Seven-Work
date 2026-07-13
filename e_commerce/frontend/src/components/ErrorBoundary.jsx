import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{ 
            padding: "1.5rem", 
            borderRadius: "12px", 
            border: "1px solid rgba(239, 68, 68, 0.2)", 
            background: "rgba(239, 68, 68, 0.02)", 
            color: "#ef4444", 
            fontFamily: "var(--font)", 
            textAlign: "center",
            boxShadow: "var(--shadow-md)"
          }}
          data-testid="error-boundary-fallback"
        >
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#b91c1c" }}>Assistant Unavailable</h4>
          <p style={{ fontSize: "0.85rem", margin: "0 0 1rem 0", color: "#4b5563" }}>
            The AI assistant encountered an unexpected layout error.
          </p>
          <button 
            type="button"
            className="btn" 
            style={{ 
              padding: "0.4rem 1rem", 
              fontSize: "0.8rem", 
              borderRadius: "999px",
              background: "#ef4444",
              color: "white",
              border: "none",
              cursor: "pointer"
            }}
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
