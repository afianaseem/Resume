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
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const initials =
    user.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";


  return (
    <header className="navbar no-print">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">R</span>
          <span>Resume<span className="brand-accent">Forge</span></span>
        </Link>

        <nav className="navbar-links">
          <div className="desktop-nav-links">
            {user.is_admin ? (
              <Link to="/admin" className={`navbar-link ${isActive("/admin") ? "active" : ""}`}>
                <span className="nav-icon">▦</span> Admin Dashboard
              </Link>
            ) : (
              <Link to="/dashboard" className={`navbar-link ${isActive("/dashboard") ? "active" : ""}`}>
                <span className="nav-icon">⌂</span> Dashboard
              </Link>
            )}

            {!user.is_admin && (
              <Link to="/profile" className={`navbar-link ${isActive("/profile") ? "active" : ""}`}>
                <span className="nav-icon">◉</span> Profile
              </Link>
            )}
          </div>

          <div className="navbar-divider" />

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className={`mobile-menu-button ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Open account menu"
            >
              <span className="user-avatar">{initials}</span>
              <span className="mobile-menu-label">Menu</span>
              <span className="menu-chevron" aria-hidden="true">⌄</span>
            </button>

            <div className="user-info">
              <span className="user-name">{user.name || "User"}</span>
              <span className="user-email">{user.email}</span>
            </div>

            <button type="button" className="logout-button" onClick={handleLogout} title="Log out">
              ↪
            </button>

            {menuOpen && (
              <div className="account-dropdown" role="menu">
                <div className="account-dropdown-header">
                  <span className="user-avatar">{initials}</span>
                  <div>
                    <strong>{user.name || "User"}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>

                {user.is_admin ? (
                  <Link
                    to="/admin"
                    className={`account-dropdown-item ${isActive("/admin") ? "active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    <span>▦</span> Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className={`account-dropdown-item ${isActive("/dashboard") ? "active" : ""}`}
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      <span>⌂</span> Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className={`account-dropdown-item ${isActive("/profile") ? "active" : ""}`}
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                    >
                      <span>◉</span> Profile
                    </Link>
                  </>
                )}

                <button type="button" className="account-dropdown-item danger" onClick={handleLogout} role="menuitem">
                  <span>↪</span> Log out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
