import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApartmentForm from '../../../components/spaces/apartments/ApartmentForm';
import '../../../styles/space.css';
import '../../../styles/modal.css';

const EditApartmentPage = () => {
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
          <h1>Edit Apartment</h1>
          <p>Update the details of your apartment.</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <a href="/spaces/apartments">Apartments</a> &gt;
          <a href={`/spaces/apartments/${id}`}> View Apartment</a> &gt;
          <span> Edit</span>
        </div>

        <ApartmentForm
          editMode={true}
          apartmentId={id}
        />
      </div>
    </div>
  );
};

export default EditApartmentPage;