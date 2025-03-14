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

  // Check if housing details are shared
  const hasSharedHousing = (tenant1, tenant2) => {
    if (!tenant1.space_id || !tenant2.space_id) return false;

    if (tenant1.space_type === 'apartment' && tenant2.space_type === 'apartment') {
      return tenant1.space_id === tenant2.space_id;
    } else if (tenant1.space_type === 'room' && tenant2.space_type === 'room') {
      return tenant1.room_id === tenant2.room_id &&
             tenant1.boarding_house_id === tenant2.boarding_house_id;
    }

    return false;
  };

  // Format housing information
  const formatHousingInfo = (tenant) => {
    if (!tenant.space_id) return 'No housing assigned';

    if (tenant.space_type === 'apartment') {
      return tenant.space_name;
    } else if (tenant.space_type === 'room') {
      return `${tenant.boarding_house_name}, Room ${tenant.room_id}`;
    }

    return 'Unknown housing type';
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

                      {/* Display housing information - showing what's inherited */}
                      <div className="tenant-housing-info">
                        <div className="housing-item">
                          <span className="housing-label">Housing:</span>
                          <span className="housing-value">{formatHousingInfo(relatedTenant)}</span>
                        </div>
                        {tenant.space_id && relatedTenant.space_id && (
                          <div className="housing-match-badge">
                            {hasSharedHousing(tenant, relatedTenant) ?
                              <span className="same-housing">✓ Inherited housing</span> :
                              <span className="different-housing">⚠ Housing differs from main tenant</span>}
                          </div>
                        )}
                      </div>
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

                  {/* Display housing inheritance information */}
                  <div className="tenant-housing-inheritance">
                    <h5>Housing Inheritance</h5>
                    <div className="housing-item">
                        <span className="housing-label">Main Tenant Housing:</span>
                        <span className="housing-value">{formatHousingInfo(mainTenant)}</span>
                    </div>
                    <div className="housing-item">
                        <span className="housing-label">Your Housing:</span>
                        <span className="housing-value">{formatHousingInfo(tenant)}</span>
                    </div>

                    {tenant.space_id && mainTenant.space_id && (
                        <div className="housing-match-status">
                        {hasSharedHousing(tenant, mainTenant) ? (
                            <div className="housing-synced">
                            <span className="sync-badge success">✓ Housing is synchronized</span>
                            <p>Your housing is automatically inherited from your main tenant.</p>
                            <p><strong>Note:</strong> As a secondary tenant, your housing assignment can only be modified
                            through the main tenant's profile. Any changes made to the main tenant's housing will
                            automatically apply to your profile as well.</p>
                            </div>
                        ) : (
                            <div className="housing-not-synced">
                            <span className="sync-badge warning">⚠ Housing differs from main tenant</span>
                            <p>Your housing is not synchronized with your main tenant. This may be due to a system error.</p>
                            <p><strong>Note:</strong> Secondary tenants should have the same housing assignment as their
                            main tenant. Please contact a system administrator to resolve this inconsistency.</p>
                            </div>
                        )}
                        </div>
                    )}
                    </div>
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