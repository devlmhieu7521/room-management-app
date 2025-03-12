import React from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceList from '../../components/spaces/SpaceList';
import '../../styles/space.css';
import '../../styles/modal.css';

const SpaceListPage = () => {
  const navigate = useNavigate();

  // Check if the user is logged in
  const isAuthenticated = localStorage.getItem('authToken');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <h1>Manage Your Spaces</h1>
          <p>View, create, edit, and manage your rental spaces.</p>
        </div>
      </div>

      <div className="container">
        <SpaceList />
      </div>
    </div>
  );
};

export default SpaceListPage;