import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    setMenuOpen(false);
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
        <Link to="/dashboard" className="navbar-brand" aria-label="ResumeForge dashboard">
          <span className="brand-mark">R</span>
          <span>Resume<span className="brand-accent">Forge</span></span>
        </Link>

        <nav className="navbar-links desktop-navbar-links" aria-label="Main navigation">
          {user.is_admin ? (
            <Link to="/admin" className={`navbar-link ${isActive("/admin") ? "active" : ""}`}>
              <span className="nav-icon">▦</span>
              Admin Dashboard
            </Link>
          ) : (
            <Link to="/dashboard" className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}>
              <span className="nav-icon">⌂</span>
              Dashboard
            </Link>
          )}

          {!user.is_admin && (
            <Link to="/profile" className={`navbar-link ${isActive("/profile") ? "active" : ""}`}>
              <span className="nav-icon">◉</span>
              Profile
            </Link>
          )}

          <div className="navbar-divider" />

          <div className="user-menu">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{user.name || "User"}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>

          <button type="button" className="logout-button" onClick={handleLogout} title="Log out" aria-label="Log out">
            ↪
          </button>
        </nav>

        <div className="mobile-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className={`mobile-menu-button ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation-menu"
          >
            <span className="mobile-menu-icon" aria-hidden="true"><i /><i /><i /></span>
            <span>Menu</span>
          </button>

          {menuOpen && (
            <div className="mobile-dropdown" id="mobile-navigation-menu">
              <div className="mobile-user-summary">
                <div className="user-avatar">{initials}</div>
                <div>
                  <strong>{user.name || "User"}</strong>
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="mobile-dropdown-divider" />

              {user.is_admin ? (
                <Link to="/admin" className={`mobile-dropdown-link ${isActive("/admin") ? "active" : ""}`}>
                  <span>▦</span> Admin Dashboard
                </Link>
              ) : (
                <Link to="/dashboard" className={`mobile-dropdown-link ${isActive("/dashboard") ? "active" : ""}`}>
                  <span>⌂</span> Dashboard
                </Link>
              )}

              {!user.is_admin && (
                <Link to="/profile" className={`mobile-dropdown-link ${isActive("/profile") ? "active" : ""}`}>
                  <span>◉</span> Profile
                </Link>
              )}

              <button type="button" className="mobile-dropdown-link mobile-logout" onClick={handleLogout}>
                <span>↪</span> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
