import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile

  const toggleSidebar = () => {
    if (window.innerWidth <= 767) {
      setIsMobileSidebarOpen((prev) => !prev); // Mobile slide
    } else {
      setIsSidebarCollapsed((prev) => !prev); // Desktop collapse
    }
  };

  // Close mobile sidebar on route change / resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 767) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="main-layout">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-overlay active"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        closeSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <div className="content-wrapper">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
