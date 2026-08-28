import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordStrength, {
  evaluatePassword,
} from "../components/PasswordStrength";
import PasswordToggleButton from "../components/PasswordToggleButton";

// Requires a proper domain with a dot + letters-only TLD.
// Examples:
// name@example.com
// user@gmail.com
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

        <h2>
          Start building your next opportunity.
        </h2>

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


  // ---------------------------------------------------------
  // Input changes
  // ---------------------------------------------------------

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Remove an old server error as soon as the user
    // starts correcting the form.
    if (error) {
      setError("");
    }
  };


  // ---------------------------------------------------------
  // Extract useful FastAPI / Axios error
  // ---------------------------------------------------------

  const getSignupError = (err) => {

    console.error("Signup request failed:", err);

    // -------------------------------------------------------
    // FastAPI response
    // -------------------------------------------------------

    const responseData = err?.response?.data;

    if (responseData) {

      // FastAPI normally returns:
      //
      // {
      //   "detail": "Some error"
      // }
      //

      if (typeof responseData.detail === "string") {
        return responseData.detail;
      }


      // FastAPI/Pydantic validation errors:
      //
      // {
      //   "detail": [
      //      {
      //        "loc": [...],
      //        "msg": "..."
      //      }
      //   ]
      // }
      //

      if (Array.isArray(responseData.detail)) {

        const messages = responseData.detail
          .map((item) => {

            if (typeof item === "string") {
              return item;
            }

            return item?.msg || "";
          })
          .filter(Boolean);

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }


      if (typeof responseData.message === "string") {
        return responseData.message;
      }


      if (typeof responseData.error === "string") {
        return responseData.error;
      }
    }


    // -------------------------------------------------------
    // HTTP status-specific errors
    // -------------------------------------------------------

    const status = err?.response?.status;

    if (status === 400) {
      return "The signup information is invalid. Please check your details.";
    }

    if (status === 409) {
      return "An account with this email already exists. Please log in instead.";
    }

    if (status === 422) {
      return "Please check your name, email address, and password.";
    }

    if (status === 500) {
      return "The server encountered an error while creating your account.";
    }

    if (status === 503) {
      return "The database is currently unavailable. Please check the Supabase connection.";
    }


    // -------------------------------------------------------
    // Network / Vercel connection failure
    // -------------------------------------------------------

    if (err?.request && !err?.response) {

      return (
        "Could not reach the server. " +
        "Please check that the Vercel API is deployed correctly."
      );
    }


    // -------------------------------------------------------
    // Fallback
    // -------------------------------------------------------

    return "Could not create your account. Please try again.";
  };


  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");


    // -------------------------------------------------------
    // Name validation
    // -------------------------------------------------------

    const name = form.name.trim();

    if (name.length < 2) {

      setError(
        "Please enter your full name."
      );

      return;
    }


    // -------------------------------------------------------
    // Email validation
    // -------------------------------------------------------

    const email = form.email.trim().toLowerCase();

    if (!email) {

      setError(
        "Please enter your email address."
      );

      return;
    }


    if (!EMAIL_RE.test(email)) {

      setError(
        "Please enter a complete email address with a domain, e.g. name@example.com"
      );

      return;
    }


    // -------------------------------------------------------
    // Password validation
    // -------------------------------------------------------

    const strength = evaluatePassword(
      form.password
    );

    if (!strength.isStrongEnough) {

      setError(
        "Your password is too weak. Use at least 8 characters with uppercase, lowercase, a number, and a special character."
      );

      return;
    }


    // -------------------------------------------------------
    // Prevent duplicate requests
    // -------------------------------------------------------

    if (busy) {
      return;
    }


    setBusy(true);


    try {

      // Use the cleaned name/email.
      await signup(
        name,
        email,
        form.password
      );


      // Signup succeeded.
      navigate("/dashboard");


    } catch (err) {

      const message = getSignupError(err);

      setError(message);


    } finally {

      setBusy(false);
    }
  };


  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <main className="auth-page">

      <div className="auth-layout">

        <BrandPanel />


        <section className="auth-form-panel">

          <form
            className="auth-card"
            onSubmit={handleSubmit}
            noValidate
          >

            <span className="auth-kicker">
              Get started
            </span>


            <h1 className="auth-title">
              Create your account
            </h1>


            <p className="auth-subtitle">
              Set up your free ResumeForge workspace in a few seconds.
            </p>


            {error && (
              <div
                className="form-error"
                role="alert"
                aria-live="polite"
              >
                <span>!</span>

                <span>
                  {error}
                </span>
              </div>
            )}


            <div className="auth-form">


              {/* ------------------------------------------------
                  Full name
              ------------------------------------------------ */}

              <label className="field-label">

                Full name{" "}
                <span className="required-mark">
                  *
                </span>


                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  autoFocus
                  required
                  disabled={busy}
                />

              </label>


              {/* ------------------------------------------------
                  Email
              ------------------------------------------------ */}

              <label className="field-label">

                Email address{" "}
                <span className="required-mark">
                  *
                </span>


                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                  disabled={busy}
                  aria-invalid={
                    Boolean(form.email) &&
                    !EMAIL_RE.test(
                      form.email.trim()
                    )
                  }
                />


                {form.email &&
                  !EMAIL_RE.test(
                    form.email.trim()
                  ) && (

                    <span className="field-error-text">
                      Enter a complete email address, e.g. name@example.com
                    </span>

                  )}

              </label>


              {/* ------------------------------------------------
                  Password
              ------------------------------------------------ */}

              <label className="field-label">

                Password{" "}
                <span className="required-mark">
                  *
                </span>


                <div className="password-field">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={busy}
                  />


                  <PasswordToggleButton
                    visible={showPassword}
                    onToggle={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                  />

                </div>


                <PasswordStrength
                  password={form.password}
                />

              </label>


              {/* ------------------------------------------------
                  Submit
              ------------------------------------------------ */}

              <button
                className="btn-primary auth-submit"
                type="submit"
                disabled={busy}
              >

                {busy
                  ? "Creating account…"
                  : "Create account"}

              </button>

            </div>


            <p className="auth-switch">

              Already have an account?{" "}

              <Link to="/login">
                Log in
              </Link>

            </p>

          </form>

        </section>

      </div>

    </main>
  );
}
