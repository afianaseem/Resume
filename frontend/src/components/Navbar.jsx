import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const initials =
    user.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="navbar no-print">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-mark">R</span>

          <span>
            Resume<span className="brand-accent">Forge</span>
          </span>
        </Link>

        <nav className="navbar-links">
          {user.is_admin ? (
            <Link
              to="/admin"
              className={`navbar-link ${isActive("/admin") ? "active" : ""}`}
            >
              <span className="nav-icon">▦</span>
              Admin Dashboard
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className={`navbar-link ${
                isActive("/dashboard") ? "active" : ""
              }`}
            >
              <span className="nav-icon">⌂</span>
              Dashboard
            </Link>
          )}

          {!user.is_admin && (
            <Link
              to="/profile"
              className={`navbar-link ${
                isActive("/profile") ? "active" : ""
              }`}
            >
              <span className="nav-icon">◉</span>
              Profile
            </Link>
          )}

          <div className="navbar-divider" />

          <div className="user-menu">
            <div className="user-avatar">
              {initials}
            </div>

            <div className="user-info">
              <span className="user-name">
                {user.name || "User"}
              </span>

              <span className="user-email">
                {user.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title="Log out"
          >
            ↪
          </button>
        </nav>
      </div>
    </header>
  );
}