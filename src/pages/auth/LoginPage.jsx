import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from '../../components/auth/Login';
import authService from '../../services/authService';

const LoginPage = () => {
  const [notification, setNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }

    // Check for success message from registration
    if (location.state?.success) {
      setNotification({
        type: 'success',
        message: location.state.success
      });

      // Clear message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location, navigate]);

  return (
    <div className="page-container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <Login />
    </div>
  );
};

export default LoginPage;