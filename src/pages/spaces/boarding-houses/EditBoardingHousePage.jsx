import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BoardingHouseForm from '../../../components/spaces/boarding-houses/BoardingHouseForm';
import '../../../styles/space.css';
import '../../../styles/boarding-house-styles.css';
import '../../../styles/modal.css';

const EditBoardingHousePage = () => {
  const { id } = useParams();
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
          <h1>Edit Boarding House</h1>
          <p>Update the details of your boarding house property.</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <a href="/spaces/boarding-houses">Boarding Houses</a> &gt;
          <a href={`/spaces/boarding-houses/${id}`}> View Boarding House</a> &gt;
          <span> Edit</span>
        </div>

        <BoardingHouseForm
          editMode={true}
          boardingHouseId={id}
        />
      </div>
    </div>
  );
};

export default EditBoardingHousePage;