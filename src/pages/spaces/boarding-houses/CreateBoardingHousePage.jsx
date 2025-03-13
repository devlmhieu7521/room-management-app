import React from 'react';
import { useNavigate } from 'react-router-dom';
import BoardingHouseForm from '../../../components/spaces/boarding-houses/BoardingHouseForm';
import '../../../styles/space.css';
import '../../../styles/boarding-house-styles.css';
import '../../../styles/modal.css';

const CreateBoardingHousePage = () => {
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
          <h1>Create New Boarding House</h1>
          <p>Fill in the details below to create a new boarding house property.</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <a href="/spaces/boarding-houses">Boarding Houses</a> &gt;
          <span> Create New Boarding House</span>
        </div>

        <BoardingHouseForm />
      </div>
    </div>
  );
};

export default CreateBoardingHousePage;