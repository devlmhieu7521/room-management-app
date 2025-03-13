import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApartmentForm from '../../../components/spaces/apartments/ApartmentForm';
import '../../../styles/space.css';
import '../../../styles/modal.css';

const CreateApartmentPage = () => {
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
          <h1>Create New Apartment</h1>
          <p>Fill in the details below to create a new apartment.</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <a href="/spaces/apartments">Apartments</a> &gt;
          <span> Create New Apartment</span>
        </div>

        <ApartmentForm />
      </div>
    </div>
  );
};

export default CreateApartmentPage;