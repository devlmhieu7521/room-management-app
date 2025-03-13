import React from 'react';
import { Link } from 'react-router-dom';

/**
 * AddRelatedTenantButton Component
 * Provides a button to quickly add a related tenant to a main tenant
 *
 * @param {Object} tenant - The main tenant object
 */
const AddRelatedTenantButton = ({ tenant }) => {
  // Only show for main tenants
  if (tenant.tenant_type !== 'main') {
    return null;
  }

  return (
    <Link
      to={`/tenants/add?mainTenantId=${tenant.id}`}
      className="btn-add-related"
      title="Add related tenant (spouse, roommate, etc.)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        <line x1="19" y1="8" x2="23" y2="8"></line>
        <line x1="21" y1="6" x2="21" y2="10"></line>
      </svg>
      <span>Add Related</span>
    </Link>
  );
};

export default AddRelatedTenantButton;