import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../../components/auth/Register';
import authService from '../../services/authService';

const RegisterPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="page-container">
      <Register />
    </div>
  );
};

export default RegisterPage;