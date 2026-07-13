import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage, useAuth } from "../context/AuthContext";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVendor, setIsVendor] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({ username, email, password, is_vendor: isVendor });
      navigate("/products", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page auth-page page-enter">
      <div className="auth-card">
        <h1>Join the crew</h1>
        <p className="auth-subtitle">
          Create an account and start shopping
        </p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="surfer_sam"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group checkbox-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", marginBottom: "1.2rem" }}>
            <input
              id="is-vendor"
              type="checkbox"
              checked={isVendor}
              onChange={(e) => setIsVendor(e.target.checked)}
              style={{ width: "auto", margin: 0, cursor: "pointer" }}
            />
            <label htmlFor="is-vendor" style={{ marginBottom: 0, cursor: "pointer", fontSize: "0.95rem", color: "var(--text)" }}>
              Register as a Vendor (Sell your own products)
            </label>
          </div>
          <button type="submit" className="btn btn-accent" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account →"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;
