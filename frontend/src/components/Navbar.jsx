import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  return (
    <header className="navbar no-print">
      <div className="navbar-inner">

        {/* Logo */}
        <Link
          to="/dashboard"
          className="navbar-brand"
          aria-label="ResumeForge home"
        >
          <span className="brand-mark">R</span>

          <span>
            Resume<span className="brand-accent">Forge</span>
          </span>
        </Link>

        {/* ================= DESKTOP NAVIGATION ================= */}
        <nav
          className="navbar-links navbar-desktop-links"
          aria-label="Main navigation"
        >
          {user.is_admin ? (
            <Link
              to="/admin"
              className={`navbar-link ${
                isActive("/admin") ? "active" : ""
              }`}
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
            aria-label="Log out"
          >
            ↪
          </button>
        </nav>

        {/* ================= MOBILE MENU ================= */}
        <div className="mobile-nav" ref={menuRef}>

          <button
            type="button"
            className={`mobile-menu-button ${
              menuOpen ? "open" : ""
            }`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Open navigation menu"
          >
            <span
              className="mobile-menu-icon"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </span>

            <span>Menu</span>
          </button>

          {menuOpen && (
            <div
              className="mobile-menu-dropdown"
              role="menu"
            >

              {/* User information */}
              <div className="mobile-menu-user">
                <div className="user-avatar">
                  {initials}
                </div>

                <div>
                  <strong>
                    {user.name || "User"}
                  </strong>

                  <span>
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="mobile-menu-divider" />

              {/* Dashboard */}
              {user.is_admin ? (
                <Link
                  to="/admin"
                  className={`mobile-menu-item ${
                    isActive("/admin") ? "active" : ""
                  }`}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>▦</span>
                  <span>Admin Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className={`mobile-menu-item ${
                    isActive("/dashboard") ? "active" : ""
                  }`}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>⌂</span>
                  <span>Dashboard</span>
                </Link>
              )}

              {/* Profile */}
              {!user.is_admin && (
                <Link
                  to="/profile"
                  className={`mobile-menu-item ${
                    isActive("/profile") ? "active" : ""
                  }`}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>◉</span>
                  <span>Profile</span>
                </Link>
              )}

              {/* Logout */}
              <button
                type="button"
                className="mobile-menu-item mobile-menu-logout"
                role="menuitem"
                onClick={handleLogout}
              >
                <span>↪</span>
                <span>Log out</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}
