import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordStrength, { evaluatePassword } from "../components/PasswordStrength";
import PasswordToggleButton from "../components/PasswordToggleButton";

// Requires a proper domain with a dot + letters-only TLD, e.g.
// name@example.com — this is what catches "signup happens without .com".
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

function BrandPanel() {
  return (
    <aside className="auth-brand-panel">
      <div className="auth-brand-content">
        <Link to="/signup" className="auth-brand-logo">
          <span className="auth-brand-mark">R</span>
          <span>
            Resume<span>Forge</span>
          </span>
        </Link>

        <h2>Start building your next opportunity.</h2>

        <p>
          Keep your education, experience, skills, and projects organized
          in one clean resume workspace.
        </p>

        <div className="auth-benefits">
          <div className="auth-benefit">
            <span className="auth-benefit-icon">✓</span>
            Create multiple resume versions
          </div>
          <div className="auth-benefit">
            <span className="auth-benefit-icon">✓</span>
            Edit your resume section by section
          </div>
          <div className="auth-benefit">
            <span className="auth-benefit-icon">✓</span>
            Preview a professional resume anytime
          </div>
        </div>
      </div>

      <div className="auth-brand-footer">
        Start simple. Build something professional.
      </div>
    </aside>
  );
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

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

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    const email = form.email.trim();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError(
        "Please enter a complete email address with a domain, e.g. name@example.com"
      );
      return;
    }

    const strength = evaluatePassword(form.password);
    if (!strength.isStrongEnough) {
      setError(
        "Your password is too weak. Use at least 8 characters with uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    setBusy(true);

    try {
      await signup(
        form.name.trim(),
        form.email.trim(),
        form.password
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not create your account. Try again."
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
            <span className="auth-kicker">Get started</span>

            <h1 className="auth-title">Create your account</h1>

            <p className="auth-subtitle">
              Set up your free ResumeForge workspace in a few seconds.
            </p>

            {error && (
              <div className="form-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <div className="auth-form">
              <label className="field-label">
                Full name <span className="required-mark">*</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  autoFocus
                  required
                />
              </label>

              <label className="field-label">
                Email address <span className="required-mark">*</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  pattern="[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}"
                  title="Enter a complete email address, e.g. name@example.com"
                  required
                />
                {form.email && !EMAIL_RE.test(form.email.trim()) && (
                  <span className="field-error-text">
                    Enter a complete email address, e.g. name@example.com
                  </span>
                )}
              </label>

              <label className="field-label">
                Password <span className="required-mark">*</span>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <PasswordToggleButton
                    visible={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                  />
                </div>
                <PasswordStrength password={form.password} />
              </label>

              <button
                className="btn-primary auth-submit"
                type="submit"
                disabled={busy}
              >
                {busy ? "Creating account…" : "Create account"}
              </button>
            </div>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link to="/login">Log in</Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
