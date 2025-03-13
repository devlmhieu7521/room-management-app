import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../services/spaceService';
import UtilitiesTab from '../../../components/spaces/UtilitiesTab';
import '../../../styles/space-detail.css';
import '../../../styles/meter-readings.css';

const ApartmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchApartmentDetails = async () => {
      try {
        setLoading(true);
        const spaceData = await spaceService.getSpaceById(id);

        if (spaceData.propertyType !== 'apartment') {
          throw new Error('Not an apartment');
        }

        setApartment(spaceData);
      } catch (error) {
        console.error('Error fetching apartment details:', error);
        setError('Failed to load apartment details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchApartmentDetails();
  }, [id]);

  const handleEditClick = () => {
    navigate(`/spaces/apartments/edit/${id}`);
  };

  const handleDeleteClick = () => {
    // This would typically show a confirmation dialog
    if (window.confirm('Are you sure you want to delete this apartment? This action cannot be undone.')) {
      deleteApartment();
    }
  };

  const deleteApartment = async () => {
    try {
      await spaceService.deleteSpace(id);
      navigate('/spaces/apartments');
    } catch (error) {
      console.error('Error deleting apartment:', error);
      setError('Failed to delete apartment. Please try again.');
    }
  };

  const formatAddress = (address) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.city}`;
  };

  if (loading) {
    return <div className="loading-container">Loading apartment details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!apartment) {
    return <div className="error-container">Apartment not found.</div>;
  }

  // Helper function to get amenity list
  const getAmenities = () => {
    const amenities = [];
    if (apartment.amenities.furniture) amenities.push('Furniture');
    if (apartment.amenities.tvCable) amenities.push('TV Cable');
    if (apartment.amenities.internet) amenities.push('Internet');
    if (apartment.amenities.airConditioner) amenities.push('Air Conditioner');
    if (apartment.amenities.waterHeater) amenities.push('Water Heater');
    if (apartment.amenities.allowPets) amenities.push('Pets Allowed');
    if (apartment.amenities.parking) amenities.push('Parking');
    if (apartment.amenities.security) amenities.push('Security');
    return amenities.length > 0 ? amenities : ['None'];
  };

  return (
    <div className="space-detail-container">
      <div className="breadcrumb">
        <Link to="/spaces/apartments">Apartments</Link> &gt;
        <span> {apartment.name}</span>
      </div>

      <div className="space-detail-header">
        <div className="space-basic-info">
          <h1>{apartment.name}</h1>
          <p className="space-address">{formatAddress(apartment.address)}</p>
          <div className="property-type-badge">
            Apartment
          </div>
          <div className={`space-status-badge ${apartment.status}`}>
            {apartment.status}
          </div>
        </div>

        <div className="space-actions">
          <button className="btn-secondary" onClick={handleEditClick}>
            Edit Apartment
          </button>
          <button className="btn-danger" onClick={handleDeleteClick}>
            Delete Apartment
          </button>
        </div>
      </div>

      <div className="space-image-gallery">
        {apartment.images && apartment.images.length > 0 ? (
          <div className="space-main-image">
            <img src={apartment.images[0].url} alt={apartment.name} />
          </div>
        ) : (
          <div className="space-no-image">
            <p>No images available</p>
          </div>
        )}

        {apartment.images && apartment.images.length > 1 && (
          <div className="space-thumbnails">
            {apartment.images.slice(1).map((image, index) => (
              <div key={index} className="space-thumbnail">
                <img src={image.url} alt={`${apartment.name} ${index + 2}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`tab-button ${activeTab === 'utilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilities')}
        >
          Utilities
        </button>
        <button
          className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenants')}
        >
          Tenants
        </button>
        <button
          className={`tab-button ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing History
        </button>
      </div>

      <div className="space-detail-content">
        {activeTab === 'details' && (
          <div className="space-details-tab">
            <div className="detail-section">
              <h3>Apartment Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Size</span>
                  <span className="detail-value">{apartment.squareMeters} m²</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Monthly Rent</span>
                  <span className="detail-value">{apartment.monthlyRent?.toLocaleString() || 0} VND</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Maximum Occupancy</span>
                  <span className="detail-value">{apartment.maxOccupancy} people</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Electricity Rate</span>
                  <span className="detail-value">{apartment.electricityPrice.toLocaleString()} VND/kWh</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Water Rate</span>
                  <span className="detail-value">{apartment.waterPrice.toLocaleString()} VND/m³</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {getAmenities().map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {(apartment.amenities.allowPets || apartment.amenities.parking) && (
              <div className="detail-section">
                <h3>Additional Fees</h3>
                <div className="detail-grid">
                  {apartment.amenities.allowPets && (
                    <div className="detail-item">
                      <span className="detail-label">Pet Fee</span>
                      <span className="detail-value">
                        {apartment.additionalFees.petFee.toLocaleString()} VND/month
                      </span>
                    </div>
                  )}
                  {apartment.amenities.parking && (
                    <div className="detail-item">
                      <span className="detail-label">Parking Fee</span>
                      <span className="detail-value">
                        {apartment.additionalFees.parkingFee.toLocaleString()} VND/month
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>System Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value">
                    {new Date(apartment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">
                    {new Date(apartment.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utilities' && (
          <UtilitiesTab space={apartment} />
        )}

        {activeTab === 'tenants' && (
          <div className="space-tenants-tab">
            <div className="empty-tab-state">
              <h3>No Tenants Assigned Yet</h3>
              <p>You haven't assigned any tenants to this apartment.</p>
              <Link to="/tenants/add" className="btn-primary">
                Add Tenant
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-billing-tab">
            <div className="empty-tab-state">
              <h3>No Billing History</h3>
              <p>No invoices have been generated for this apartment yet.</p>
              <Link to="/invoices/create" className="btn-primary">
                Create Invoice
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentDetailPage;