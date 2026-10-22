import { useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── STEP 1: Email submit ──────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setSuccess("OTP sent! Check your email.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: OTP verify ────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/verify-otp", { email, otp });
      setSuccess("OTP verified! Set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset password ────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    setLoading(true);
    try {
      await API.post("/auth/reset-password", { email, otp, newPassword });
      setSuccess("Password reset successfully! Redirecting to login…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Left Panel (same as Login) */}
      <div className="login-left">
        <div className="login-grid" />
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-left-inner">
          <p className="login-left-tagline">
            Reset your <span>DQAAS</span> password
          </p>
          <p className="login-left-sub">
            Follow the steps to securely regain access to your account.
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

          {/* Step Indicator */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", justifyContent: "center" }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: s === step ? "28px" : "10px",
                  height: "10px",
                  borderRadius: "5px",
                  background: s <= step ? "var(--primary, #4F46E5)" : "#e5e7eb",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <h1 className="login-heading">Forgot Password?</h1>
              <p className="login-subheading">
                Enter your email and we'll send you an OTP code.
              </p>

              {error && <div className="login-error"><span>⚠</span> {error}</div>}

              <form className="login-form" onSubmit={handleSendOTP}>
                <div className="login-field">
                  <label className="login-label">Email Address</label>
                  <div className="login-input-wrap">
                    <input
                      className="login-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <span className="login-input-icon">✉</span>
                  </div>
                </div>

                <button className="login-btn" type="submit" disabled={loading}>
                  {loading && <span className="login-spinner" />}
                  {loading ? "Sending…" : "Send OTP →"}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <h1 className="login-heading">Enter OTP</h1>
              <p className="login-subheading">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              {success && <div className="login-error" style={{ background: "#d1fae5", color: "#065f46", borderColor: "#a7f3d0" }}>{success}</div>}
              {error && <div className="login-error"><span>⚠</span> {error}</div>}

              <form className="login-form" onSubmit={handleVerifyOTP}>
                <div className="login-field">
                  <label className="login-label">OTP Code</label>
                  <div className="login-input-wrap">
                    <input
                      className="login-input"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                      style={{ letterSpacing: "6px", fontSize: "20px", textAlign: "center" }}
                    />
                  </div>
                </div>

                <button className="login-btn" type="submit" disabled={loading || otp.length < 6}>
                  {loading && <span className="login-spinner" />}
                  {loading ? "Verifying…" : "Verify OTP →"}
                </button>
              </form>

              <p className="login-footer">
                Didn't receive it?{" "}
                <span
                  style={{ color: "var(--primary, #4F46E5)", cursor: "pointer" }}
                  onClick={() => { setStep(1); setError(""); setSuccess(""); }}
                >
                  Resend OTP
                </span>
              </p>
            </>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <>
              <h1 className="login-heading">New Password</h1>
              <p className="login-subheading">
                Choose a strong password for your account.
              </p>

              {success && <div className="login-error" style={{ background: "#d1fae5", color: "#065f46", borderColor: "#a7f3d0" }}>{success}</div>}
              {error && <div className="login-error"><span>⚠</span> {error}</div>}

              <form className="login-form" onSubmit={handleResetPassword}>
                <div className="login-field">
                  <label className="login-label">New Password</label>
                  <div className="login-input-wrap">
                    <input
                      className="login-input"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <span className="login-input-icon">🔒</span>
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label">Confirm Password</label>
                  <div className="login-input-wrap">
                    <input
                      className="login-input"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <span className="login-input-icon">🔒</span>
                  </div>
                </div>

                <button className="login-btn" type="submit" disabled={loading}>
                  {loading && <span className="login-spinner" />}
                  {loading ? "Resetting…" : "Reset Password →"}
                </button>
              </form>
            </>
          )}

          <p className="login-footer">
            Remember your password?{" "}
            <Link to="/login">Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  );
}