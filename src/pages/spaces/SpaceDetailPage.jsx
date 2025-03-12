import React from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceDetail from '../../components/spaces/SpaceDetail';
import '../../styles/space-detail.css';

const SpaceDetailPage = () => {
  const navigate = useNavigate();

  // Check if the user is logged in
  const isAuthenticated = localStorage.getItem('authToken');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="page-container">
      <SpaceDetail />
    </div>
  );
};

export default SpaceDetailPage;