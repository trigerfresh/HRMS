import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSignOutAlt } from "react-icons/fa";

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-left">
        <a className="toggle-button" onClick={onToggleSidebar}>
          <FaBars />
        </a>
        <span className="header-title">HRMS Portal</span>
      </div>
      <div className="user-info">
        <span>Welcome, {user ? user.name : "Guest"}</span>
        <button onClick={handleLogout} className="logout-button" title="Logout">
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default Header;
