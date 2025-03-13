import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

/**
 * SpaceListSwitcher Component
 * Provides navigation tabs to switch between apartments and boarding houses
 */
const SpaceListSwitcher = ({ activeType = 'apartments' }) => {
  const navigate = useNavigate();

  return (
    <div className="space-list-switcher">
      <div className="switcher-tabs">
        <NavLink
          to="/spaces/apartments"
          className={({ isActive }) =>
            `switcher-tab ${isActive ? 'active' : ''}`
          }
        >
          <div className="switcher-tab-icon">🏢</div>
          <div className="switcher-tab-content">
            <h3 className="switcher-tab-title">Apartments</h3>
            <p className="switcher-tab-description">Single unit properties</p>
          </div>
        </NavLink>

        <NavLink
          to="/spaces/boarding-houses"
          className={({ isActive }) =>
            `switcher-tab ${isActive ? 'active' : ''}`
          }
        >
          <div className="switcher-tab-icon">🏘️</div>
          <div className="switcher-tab-content">
            <h3 className="switcher-tab-title">Boarding Houses</h3>
            <p className="switcher-tab-description">Multi-room properties</p>
          </div>
        </NavLink>
      </div>

      <div className="create-buttons">
        {activeType === 'apartments' && (
          <button
            className="btn-primary"
            onClick={() => navigate('/spaces/create', { state: { propertyType: 'apartment' } })}
          >
            Create New Apartment
          </button>
        )}

        {activeType === 'boarding-houses' && (
          <button
            className="btn-primary"
            onClick={() => navigate('/spaces/create', { state: { propertyType: 'boarding_house' } })}
          >
            Create New Boarding House
          </button>
        )}
      </div>
    </div>
  );
};

export default SpaceListSwitcher;