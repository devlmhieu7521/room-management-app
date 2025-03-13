import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TenantForm from '../../components/tenants/TenantForm';
import '../../styles/tenant.css';

const AddTenantPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get any query parameters (for pre-selecting a space)
  const queryParams = new URLSearchParams(location.search);
  const spaceId = queryParams.get('spaceId');
  const roomId = queryParams.get('roomId');
  const boardingHouseId = queryParams.get('boardingHouseId');

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
          <h1>Add New Tenant</h1>
          <p>Create a new tenant record and optionally assign them to a space.</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <a href="/tenants">Tenants</a> &gt;
          <span> Add New Tenant</span>
        </div>

        <TenantForm
          preselectedSpace={{
            spaceId,
            roomId,
            boardingHouseId
          }}
        />
      </div>
    </div>
  );
};

export default AddTenantPage;