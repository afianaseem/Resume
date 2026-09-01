import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import Navbar from "../components/Navbar";
import PasswordStrength, {
  evaluatePassword,
} from "../components/PasswordStrength";
import PasswordToggleButton from "../components/PasswordToggleButton";

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function getApiErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter(Boolean);

    if (messages.length) return messages.join(" ");
  }

  return fallback;
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const passwordEvaluation = evaluatePassword(passwords.new_password);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileError("");
    setProfileMsg("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setProfileError("Please enter a valid name.");
      return;
    }

    setSavingProfile(true);

    try {
      const res = await client.put("/auth/me", {
        name: trimmedName,
      });

      updateUser(res.data);
      setName(res.data.name || trimmedName);
      setProfileMsg("Profile updated successfully.");
    } catch (err) {
      setProfileError(
        getApiErrorMessage(err, "Could not update your profile.")
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordMsg("");

    if (!passwords.current_password) {
      setPasswordError("Enter your current password.");
      return;
    }

    if (!passwordEvaluation.isStrongEnough) {
      setPasswordError(
        "Your new password is too weak. Complete all password requirements below."
      );
      return;
    }

    if (passwords.current_password === passwords.new_password) {
      setPasswordError(
        "Your new password should be different from the current password."
      );
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError(
        "New password and confirmation do not match."
      );
      return;
    }

    setSavingPassword(true);

    try {
      await client.put("/auth/me/password", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });

      setPasswordMsg("Password updated successfully.");
      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPasswordError(
        getApiErrorMessage(err, "Could not update your password.")
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="page-content narrow profile-page">
        <header className="profile-heading">
          <span className="eyebrow">ACCOUNT SETTINGS</span>
          <h1>Your profile</h1>
          <p>
            Manage your personal information and account security.
          </p>
        </header>

        <section className="profile-identity">
          <div className="profile-avatar">{initials}</div>

          <div>
            <h2>{user?.name || "Your account"}</h2>
            <p>{user?.email || "No email available"}</p>
          </div>
        </section>

        <form className="settings-card" onSubmit={handleProfileSubmit}>
          <div className="settings-card-header">
            <div className="settings-card-icon">◉</div>
            <div>
              <h2>Basic information</h2>
              <p>
                This information is used to identify your ResumeForge
                account.
              </p>
            </div>
          </div>

          {profileError && (
            <div className="form-error" role="alert">
              <span>!</span>
              {profileError}
            </div>
          )}

          {profileMsg && (
            <div className="form-success" role="status">
              {profileMsg}
            </div>
          )}

          <div className="settings-form">
            <label className="field-label">
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </label>

            <label className="field-label">
              Email address
              <input
                type="email"
                value={user?.email || ""}
                disabled
                readOnly
              />
            </label>

            <button
              className="btn-primary"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <form className="settings-card" onSubmit={handlePasswordSubmit}>
          <div className="settings-card-header">
            <div className="settings-card-icon">⌁</div>
            <div>
              <h2>Security</h2>
              <p>
                Change your password regularly to keep your account secure.
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="form-error" role="alert">
              <span>!</span>
              {passwordError}
            </div>
          )}

          {passwordMsg && (
            <div className="form-success" role="status">
              {passwordMsg}
            </div>
          )}

          <div className="settings-form">
            <label className="field-label">
              Current password
              <div className="password-field">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={passwords.current_password}
                  onChange={(e) =>
                    setPasswords((previous) => ({
                      ...previous,
                      current_password: e.target.value,
                    }))
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />
                <PasswordToggleButton
                  visible={showCurrent}
                  onToggle={() => setShowCurrent((value) => !value)}
                />
              </div>
            </label>

            <label className="field-label">
              New password
              <div className="password-field">
                <input
                  type={showNew ? "text" : "password"}
                  value={passwords.new_password}
                  onChange={(e) =>
                    setPasswords((previous) => ({
                      ...previous,
                      new_password: e.target.value,
                    }))
                  }
                  placeholder="Create new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <PasswordToggleButton
                  visible={showNew}
                  onToggle={() => setShowNew((value) => !value)}
                />
              </div>

              <PasswordStrength password={passwords.new_password} />
            </label>

            <label className="field-label">
              Confirm new password
              <div className="password-field">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={passwords.confirm_password}
                  onChange={(e) =>
                    setPasswords((previous) => ({
                      ...previous,
                      confirm_password: e.target.value,
                    }))
                  }
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <PasswordToggleButton
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((value) => !value)}
                />
              </div>
              {passwords.confirm_password &&
                passwords.confirm_password !== passwords.new_password && (
                  <span className="field-error-text">
                    Passwords do not match.
                  </span>
                )}
            </label>

            <button
              className="btn-primary"
              type="submit"
              disabled={savingPassword}
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
