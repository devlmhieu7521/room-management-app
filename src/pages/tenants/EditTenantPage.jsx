import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TenantForm from '../../components/tenants/TenantForm';
import '../../styles/tenant.css';

const EditTenantPage = () => {
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
          <h1>Edit Tenant</h1>
          <p>Update tenant information and housing assignment.</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <a href="/tenants">Tenants</a> &gt;
          <a href={`/tenants/${id}`}> View Tenant</a> &gt;
          <span> Edit</span>
        </div>

        <TenantForm
          editMode={true}
          initialTenantId={id}
        />
      </div>
    </div>
  );
};

export default EditTenantPage;