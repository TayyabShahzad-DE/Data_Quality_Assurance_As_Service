import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";

export default function Header({ toggleSidebar }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="header">

      {/* Sidebar Toggle */}
      <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <span className="menu-bar" />
        <span className="menu-bar" />
        <span className="menu-bar" />
      </button>

      {/* Logo */}
      <div className="header-logo">
        <span className="logo-icon">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1"  y="1"  width="9" height="9" rx="2.5" fill="#6c56f5" opacity="0.9"/>
            <rect x="12" y="1"  width="9" height="9" rx="2.5" fill="#9b8aff" opacity="0.7"/>
            <rect x="1"  y="12" width="9" height="9" rx="2.5" fill="#9b8aff" opacity="0.7"/>
            <rect x="12" y="12" width="9" height="9" rx="2.5" fill="#6c56f5" opacity="0.5"/>
          </svg>
        </span>
        <div className="logo-text">
          <span className="logo-main">Data Quality Assurance</span>
          <span className="logo-sub">As a Service</span>
        </div>
      </div>

      {/* Search */}
      <div className={`search-wrapper ${searchFocused ? "focused" : ""}`}>
        <svg className="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search datasets, reports..."
          className="search"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className="search-kbd">⌘K</kbd>
      </div>

      {/* Right Section */}
      <div className="header-right">

        {/* Notification Bell */}
        <button className="icon-btn" aria-label="Notifications">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M8.5 1.5A5 5 0 0 0 3.5 6.5V10l-1.5 2h13L13.5 10V6.5A5 5 0 0 0 8.5 1.5Z"
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M6.5 12.5a2 2 0 0 0 4 0"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="notif-dot" />
        </button>

        {/* Profile Dropdown */}
        <div className="profile-wrapper" ref={dropdownRef}>
          <button
            className={`profile-btn ${dropdownOpen ? "active" : ""}`}
            onClick={() => setDropdownOpen((p) => !p)}
            aria-label="Profile menu"
          >
            <div className="avatar">
              <span>AK</span>
            </div>
            <div className="profile-info">
              <span className="profile-name">Jack James</span>
              <span className="profile-role">Admin</span>
            </div>
            <svg
              className={`chevron ${dropdownOpen ? "open" : ""}`}
              width="12" height="12" viewBox="0 0 12 12" fill="none"
            >
              <path d="M2 4L6 8L10 4"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dropdown — only renders when open for clean animation */}
          <div className={`profile-dropdown ${dropdownOpen ? "visible" : ""}`}>

            {/* User info header */}
            <div className="pd-header">
              <div className="pd-avatar">AK</div>
              <div className="pd-info">
                <p className="pd-name">Jack James</p>
                <p className="pd-email">jackhames@gmail.com</p>
              </div>
            </div>

            <div className="pd-divider" />

            {/* Menu items */}
            <button className="pd-item">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1.5 13.5C1.5 11 4.2 9 7.5 9s6 2 6 4.5"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              My Profile
            </button>

            <button className="pd-item">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14
                         M2.93 2.93l1.06 1.06M11.01 11.01l1.06 1.06
                         M2.93 12.07l1.06-1.06M11.01 3.99l1.06-1.06"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Settings
            </button>

            <button className="pd-item">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1L9.18 5.26L14 5.73L10.55 8.74L11.63 13.5L7.5 11L3.37 13.5L4.45 8.74L1 5.73L5.82 5.26L7.5 1Z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              Help & Support
            </button>

            <div className="pd-divider" />

            <button className="pd-item danger" onClick={handleLogout}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M5.5 13.5H3a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h2.5"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M10 10.5L13 7.5L10 4.5"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 7.5H6"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Logout
            </button>

          </div>
        </div>
      </div>

    </header>
  );
}