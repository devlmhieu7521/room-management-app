import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Navbar from './components/layout/Navbar';
import SpaceForm from './components/spaces/SpaceForm';
import MySpaces from './components/spaces/MySpaces';
import BookingsList from './components/bookings/BookingsList';
import SpaceDetails from './components/spaces/SpaceDetails';
import BookingDetails from './components/bookings/BookingDetails';
import UserProfile from './components/profile/UserProfile';
import HostDashboard from './components/dashboard/HostDashboard';
import TenantsList from './components/tenants/TenantsList';
import AddTenant from './components/tenants/AddTenant';
import SpaceManagement from './components/spaces/SpaceManagement';


const theme = createTheme({
  palette: {
    primary: {
      main: '#5c6bc0', // Indigo
    },
    secondary: {
      main: '#26a69a', // Teal
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <HostDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants"
            element={
              <ProtectedRoute>
                <TenantsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenants/add"
            element={
              <ProtectedRoute>
                <AddTenant />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route
            path="/my-spaces"
            element={
              <ProtectedRoute>
                <MySpaces />
              </ProtectedRoute>
            }
          />
          <Route
            path="/spaces/:spaceId/manage"
            element={
              <ProtectedRoute>
                <SpaceManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;