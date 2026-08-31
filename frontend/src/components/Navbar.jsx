import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (!user) return null;

  return (
    <header className="navbar no-print">
      <div className="navbar-inner">
        <Link to={user.is_admin ? "/admin" : "/dashboard"} className="navbar-brand" aria-label="ResumeForge">
          <span className="brand-mark">R</span>
          <span>Resume<span className="brand-accent">Forge</span></span>
        </Link>

        {/* Desktop navigation. It is completely hidden on mobile. */}
        <nav className="navbar-links navbar-desktop-links" aria-label="Main navigation">
          {user.is_admin ? (
            <Link to="/admin" className={`navbar-link ${isActive("/admin") ? "active" : ""}`}>
              <span className="nav-icon">▦</span> Admin Dashboard
            </Link>
          ) : (
            <>
              <Link to="/dashboard" className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}>
                <span className="nav-icon">⌂</span> Dashboard
              </Link>
              <Link to="/profile" className={`navbar-link ${isActive("/profile") ? "active" : ""}`}>
                <span className="nav-icon">◉</span> Profile
              </Link>
            </>
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

        {/* Mobile navigation: this is the ONLY navigation control shown on phones. */}
        <div className="mobile-nav" ref={menuRef}>
          <button
            type="button"
            className={`mobile-menu-button ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Open navigation menu"
          >
            <span className="mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="mobile-menu-label">Menu</span>
            <span className="menu-chevron" aria-hidden="true">⌄</span>
          </button>

          {menuOpen && (
            <div className="mobile-menu-dropdown" role="menu">
              <div className="mobile-menu-user">
                <div className="mobile-menu-avatar">{initials}</div>
                <div className="mobile-menu-user-copy">
                  <strong>{user.name || "User"}</strong>
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="mobile-menu-divider" />

              {user.is_admin ? (
                <Link
                  to="/admin"
                  className={`mobile-menu-item ${isActive("/admin") ? "active" : ""}`}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mobile-menu-item-icon">▦</span>
                  <span>Admin Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`mobile-menu-item ${isActive("/dashboard") ? "active" : ""}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mobile-menu-item-icon">⌂</span>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    className={`mobile-menu-item ${isActive("/profile") ? "active" : ""}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mobile-menu-item-icon">◉</span>
                    <span>Profile</span>
                  </Link>
                </>
              )}

              <button type="button" className="mobile-menu-item mobile-menu-logout" role="menuitem" onClick={handleLogout}>
                <span className="mobile-menu-item-icon">↪</span>
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
