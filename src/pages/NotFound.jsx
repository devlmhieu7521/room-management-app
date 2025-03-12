import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '0 20px'
    }}>
      <h1 style={{ fontSize: '6rem', margin: '0', color: '#4a6fdc' }}>404</h1>
      <h2 style={{ margin: '10px 0 30px' }}>Page Not Found</h2>
      <p style={{ maxWidth: '500px', marginBottom: '30px' }}>
        The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>
      <Link to="/" className="btn">
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;