import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const MainLayout = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Helper function to get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return '?';

    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="main-layout">
      {/* Navigation Header */}
      <nav className="main-nav">
        <div className="nav-container">
          <Link to="/dashboard" className="logo">
            Room Rental System
          </Link>

          <div className="nav-links">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/spaces"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Spaces
            </NavLink>

            <NavLink
            to="/tenants"
            className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
            }
            >
            Tenants
            </NavLink>

            {/* Add more navigation links as needed */}

            <div className="user-menu">
              <button
                className="user-menu-button"
                onClick={toggleMenu}
                aria-expanded={menuOpen}
              >
                <div className="user-avatar">
                  {getUserInitials()}
                </div>
                <span className="user-name">{user.name}</span>
                <span className="dropdown-icon">▾</span>
              </button>

              {menuOpen && (
                <div className="user-dropdown">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={closeMenu}
                  >
                    Settings
                  </Link>
                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Room Rental Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;