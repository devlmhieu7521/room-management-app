import React from 'react';
import { useNavigate } from 'react-router-dom';
import SpaceForm from '../../components/spaces/SpaceForm';
import '../../styles/space.css';
import '../../styles/modal.css';

const CreateSpacePage = () => {
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
          <h1>Create New Space</h1>
          <p>Fill in the details below to create a new rental space.</p>
        </div>
      </div>

      <div className="container">
        <SpaceForm />
      </div>
    </div>
  );
};

export default CreateSpacePage;