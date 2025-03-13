import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SpaceRedirectPage
 *
 * This component redirects from the /spaces URL to the apartments list by default
 */
const SpaceRedirectPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to apartments page by default
    navigate('/spaces/apartments');
  }, [navigate]);

  return <div>Redirecting...</div>;
};

export default SpaceRedirectPage;