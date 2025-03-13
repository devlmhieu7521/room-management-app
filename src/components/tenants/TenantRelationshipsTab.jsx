import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tenantService from '../../services/tenantService';

/**
 * TenantRelationshipsTab Component
 * Displays relationship information for a tenant, showing either the main tenant (if this is a normal tenant)
 * or the related tenants (if this is a main tenant)
 *
 * @param {Object} tenant - The tenant object
 */
const TenantRelationshipsTab = ({ tenant }) => {
  const [mainTenant, setMainTenant] = useState(null);
  const [relatedTenants, setRelatedTenants] = useState([]);
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelationshipData = async () => {
      try {
        setLoading(true);

        // Get relationship type definitions
        const relationshipTypeOptions = tenantService.getRelationshipTypes();
        setRelationshipTypes(relationshipTypeOptions);

        if (tenant.tenant_type === 'main') {
          // Fetch related tenants if this is a main tenant
          if (tenant.related_tenants && tenant.related_tenants.length > 0) {
            const relatedTenantsData = await Promise.all(
              tenant.related_tenants.map(id => tenantService.getTenantById(id))
            );
            setRelatedTenants(relatedTenantsData);
          }
        } else if (tenant.tenant_type === 'normal' && tenant.main_tenant_id) {
          // Fetch main tenant if this is a normal tenant
          const mainTenantData = await tenantService.getTenantById(tenant.main_tenant_id);
          setMainTenant(mainTenantData);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching relationship data:', err);
        setError('Failed to load tenant relationship information');
      } finally {
        setLoading(false);
      }
    };

    fetchRelationshipData();
  }, [tenant]);

  // Get tenant's full name
  const getTenantFullName = (tenant) => {
    return `${tenant.first_name} ${tenant.last_name}`;
  };

  // Get relationship label from relationship type value
  const getRelationshipLabel = (relationshipType) => {
    const relationship = relationshipTypes.find(t => t.value === relationshipType);
    return relationship ? relationship.label : 'Unknown relationship';
  };

  if (loading) {
    return <div className="loading">Loading relationship data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="tenant-relationships-tab">
      <div className="detail-section">
        <h3>Tenant Relationship Information</h3>

        <div className="tenant-type-info">
          <strong>Tenant Type:</strong>
          <span className="tenant-type-badge">
            {tenant.tenant_type === 'main' ? 'Main Tenant (Primary)' : 'Normal Tenant (Secondary)'}
          </span>
        </div>

        {tenant.tenant_type === 'main' ? (
          // Display related tenants for main tenant
          <div className="related-tenants-section">
            <h4>Related Tenants</h4>

            {relatedTenants.length === 0 ? (
              <p className="no-data">No related tenants found.</p>
            ) : (
              <div className="related-tenants-list">
                {relatedTenants.map(relatedTenant => (
                  <div key={relatedTenant.id} className="related-tenant-card">
                    <div className="tenant-card-header">
                      <div className="tenant-avatar">
                        {relatedTenant.first_name[0]}{relatedTenant.last_name[0]}
                      </div>
                      <div className="tenant-header-content">
                        <h4 className="tenant-name">{getTenantFullName(relatedTenant)}</h4>
                        <div className="relationship-type">
                          {getRelationshipLabel(relatedTenant.relationship_type)}
                        </div>
                      </div>
                    </div>

                    <div className="tenant-card-body">
                      <div className="tenant-contact-info">
                        <div className="contact-item">
                          <span className="contact-label">Email:</span>
                          <span className="contact-value">{relatedTenant.email}</span>
                        </div>
                        <div className="contact-item">
                          <span className="contact-label">Phone:</span>
                          <span className="contact-value">{relatedTenant.phone_number}</span>
                        </div>
                      </div>

                      {relatedTenant.space_id === tenant.space_id ? (
                        <div className="shared-space-info">
                          <span className="shared-space-badge">Shares same living space</span>
                        </div>
                      ) : (
                        <div className="different-space-info">
                          <span className="different-space-badge">Has separate living space</span>
                        </div>
                      )}
                    </div>

                    <div className="tenant-card-footer">
                      <Link to={`/tenants/${relatedTenant.id}`} className="btn-secondary">
                        View Tenant Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="add-related-tenant">
              <Link to={`/tenants/add?mainTenantId=${tenant.id}`} className="btn-primary">
                Add Related Tenant
              </Link>
            </div>
          </div>
        ) : (
          // Display main tenant information for normal tenant
          <div className="main-tenant-section">
            <h4>Main Tenant</h4>

            {!mainTenant ? (
              <p className="no-data">No main tenant assigned.</p>
            ) : (
              <div className="main-tenant-card">
                <div className="tenant-card-header">
                  <div className="tenant-avatar">
                    {mainTenant.first_name[0]}{mainTenant.last_name[0]}
                  </div>
                  <div className="tenant-header-content">
                    <h4 className="tenant-name">{getTenantFullName(mainTenant)}</h4>
                    <div className="relationship-type">
                      You are their {getRelationshipLabel(tenant.relationship_type)}
                    </div>
                  </div>
                </div>

                <div className="tenant-card-body">
                  <div className="tenant-contact-info">
                    <div className="contact-item">
                      <span className="contact-label">Email:</span>
                      <span className="contact-value">{mainTenant.email}</span>
                    </div>
                    <div className="contact-item">
                      <span className="contact-label">Phone:</span>
                      <span className="contact-value">{mainTenant.phone_number}</span>
                    </div>
                  </div>

                  {mainTenant.space_id === tenant.space_id ? (
                    <div className="shared-space-info">
                      <span className="shared-space-badge">Shares same living space</span>
                    </div>
                  ) : (
                    <div className="different-space-info">
                      <span className="different-space-badge">Has separate living space</span>
                    </div>
                  )}
                </div>

                <div className="tenant-card-footer">
                  <Link to={`/tenants/${mainTenant.id}`} className="btn-secondary">
                    View Main Tenant Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantRelationshipsTab;