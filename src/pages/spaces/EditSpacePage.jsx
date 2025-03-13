import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SpaceForm from '../../components/spaces/SpaceForm';
import '../../styles/space.css';
import '../../styles/modal.css';

const EditSpacePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab');
  const initialAction = queryParams.get('action');

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
          <h1>Edit Space</h1>
          <p>Update the details of your rental space.</p>
        </div>
      </div>

      <div className="container">
        <SpaceForm
          editMode={true}
          spaceId={id}
          initialTab={initialTab}
          initialAction={initialAction}
        />
      </div>
    </div>
  );
};

export default EditSpacePage;