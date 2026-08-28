import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordToggleButton from "../components/PasswordToggleButton";

function BrandPanel() {
  return (
    <aside className="auth-brand-panel">
      <div className="auth-brand-content">
        <Link to="/login" className="auth-brand-logo">
          <span className="auth-brand-mark">R</span>
          <span>
            Resume<span>Forge</span>
          </span>
        </Link>

        <h2>Build a resume that gets noticed.</h2>

        <p>
          Create polished, professional resumes and keep every version
          organized in one simple workspace.
        </p>

        <div className="auth-benefits">
          <div className="auth-benefit">
            <span className="auth-benefit-icon">✓</span>
            Simple step-by-step resume builder
          </div>
          <div className="auth-benefit">
            <span className="auth-benefit-icon">✓</span>
            Keep multiple resume versions
          </div>
          <div className="auth-benefit">
            <span className="auth-benefit-icon">✓</span>
            Preview and print your resume
          </div>
        </div>
      </div>

      <div className="auth-brand-footer">
        Your career. Your story. Your resume.
      </div>
    </aside>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await login(form.email.trim(), form.password);
      // Administrator accounts use a completely separate dashboard.
      const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(loggedInUser.is_admin ? "/admin" : "/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not log in. Check your email and password."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <BrandPanel />

        <section className="auth-form-panel">
          <form className="auth-card" onSubmit={handleSubmit}>
            <span className="auth-kicker">Welcome back</span>

            <h1 className="auth-title">Log in to ResumeForge</h1>

            <p className="auth-subtitle">
              Continue building your resumes right where you left off.
            </p>

            {error && (
              <div className="form-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <div className="auth-form">
              <label className="field-label">
                Email address
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </label>

              <label className="field-label">
                Password
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <PasswordToggleButton
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                  />
                </div>
              </label>

              <button
                className="btn-primary auth-submit"
                type="submit"
                disabled={busy}
              >
                {busy ? "Logging in…" : "Log in"}
              </button>
            </div>

            <p className="auth-switch">
              New to ResumeForge?{" "}
              <Link to="/signup">Create an account</Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
