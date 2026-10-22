import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css"; // ✅ FIX: capital L

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleDemoLogin = () => {
    localStorage.setItem("token", "demo-token-" + Date.now());
    localStorage.setItem("user", JSON.stringify({ email: "admin@dqaas.com", name: "Admin User" }));
    navigate("/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data?.token || "demo-token");
      localStorage.setItem("user", JSON.stringify(res.data?.user || { email: form.email }));
      navigate("/dashboard");
    } catch (err) {
      // If backend is offline / unreachable, allow seamless demo login
      if (!err.response || err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
        localStorage.setItem("token", "demo-token-" + Date.now());
        localStorage.setItem("user", JSON.stringify({ email: form.email, name: form.email.split("@")[0] }));
        navigate("/dashboard");
      } else {
        setError(
          err.response?.data?.message ||
            "Invalid credentials. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Left Panel */}
      <div className="login-left">
        <div className="login-grid" />
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-left-inner">
          <p className="login-left-tagline">
            Build something <span>DQAAS</span>
          </p>
          <p className="login-left-sub">
            Sign in to your account and pick up right where you left off.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-box">

          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-dot" />
            <span className="login-logo-text">DQAAS</span>
          </div>

          {/* Heading */}
          <h1 className="login-heading">Welcome back</h1>
          <p className="login-subheading">
            Sign in to continue to your dashboard
          </p>

          {/* Error */}
          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>

            <div className="login-field">
              <label className="login-label">Email Address</label>
              <div className="login-input-wrap">
                <input
                  className="login-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                />
                <span className="login-input-icon">✉</span>
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <input
                  className="login-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <span className="login-input-icon">🔒</span>
              </div>
            </div>

            <div className="login-row">
              {/* ✅ FIX: Link use instead of <a href="#"> */}
              <Link to="/forgot-password" className="login-forgot">
                Forgot password?
              </Link>
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading}
            >
              {loading && <span className="login-spinner" />}
              {loading ? "Signing in…" : "Sign In →"}
            </button>

            <button
              type="button"
              className="login-btn"
              onClick={handleDemoLogin}
              style={{
                marginTop: "10px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#e2e8f0",
                boxShadow: "none"
              }}
            >
              ⚡ Quick Demo Sign In
            </button>

          </form>

          <p className="login-footer">
            Don't have an account?{" "}
            <Link to="/register">Create one free</Link>
          </p>

        </div>
      </div>
    </div>
  );
}