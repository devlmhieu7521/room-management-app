import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TenantForm from '../../components/tenants/TenantForm';
import tenantService from '../../services/tenantService';
import '../../styles/tenant.css';

const AddTenantPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mainTenant, setMainTenant] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get any query parameters (for pre-selecting a space or main tenant)
  const queryParams = new URLSearchParams(location.search);
  const spaceId = queryParams.get('spaceId');
  const roomId = queryParams.get('roomId');
  const boardingHouseId = queryParams.get('boardingHouseId');
  const mainTenantId = queryParams.get('mainTenantId');

  // If adding a related tenant, fetch the main tenant details for display
  useEffect(() => {
    const fetchMainTenant = async () => {
      if (mainTenantId) {
        setLoading(true);
        try {
          const tenant = await tenantService.getTenantById(mainTenantId);
          setMainTenant(tenant);
        } catch (error) {
          console.error('Error fetching main tenant:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMainTenant();
  }, [mainTenantId]);

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
          <h1>
            {mainTenant
              ? `Add Related Tenant for ${mainTenant.first_name} ${mainTenant.last_name}`
              : 'Add New Tenant'}
          </h1>
          <p>
            {mainTenant
              ? 'Create a new related tenant record for a family member, spouse, roommate, etc.'
              : 'Create a new tenant record and optionally assign them to a space.'}
          </p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <a href="/tenants">Tenants</a> &gt;
          {mainTenant ? (
            <>
              <a href={`/tenants/${mainTenant.id}`}> {mainTenant.first_name} {mainTenant.last_name}</a> &gt;
              <span> Add Related Tenant</span>
            </>
          ) : (
            <span> Add New Tenant</span>
          )}
        </div>

        {mainTenant && (
          <div className="related-tenant-info">
            <div className="main-tenant-card">
              <h3>Adding Related Tenant For</h3>
              <div className="main-tenant-details">
                <div className="tenant-avatar">
                  {mainTenant.first_name[0]}{mainTenant.last_name[0]}
                </div>
                <div className="main-tenant-name">
                  <span className="full-name">{mainTenant.first_name} {mainTenant.last_name}</span>
                  <span className="tenant-type">Main Tenant</span>
                </div>
              </div>
              <p className="relationship-info">
                The tenant you're adding will be linked to this main tenant and will inherit certain settings.
              </p>
            </div>
          </div>
        )}

        <TenantForm
          preselectedSpace={{
            spaceId,
            roomId,
            boardingHouseId
          }}
          mainTenantId={mainTenantId}
        />
      </div>
    </div>
  );
};

export default AddTenantPage;