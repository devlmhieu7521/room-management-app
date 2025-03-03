import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import fixed components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Navbar from './components/layout/Navbar';
import SpaceForm from './components/spaces/SpaceForm';
import MySpaces from './components/spaces/MySpaces';
import SpaceDetails from './components/spaces/SpaceDetails';
import UserProfile from './components/profile/UserProfile';
import HostDashboard from './components/dashboard/HostDashboard';
import TenantsList from './components/tenants/TenantsList';
import TenantManagement from './components/tenants/TenantManagement';
import AddTenant from './components/tenants/AddTenant';
import TenantDetails from './components/tenants/TenantDetails';
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
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <Navbar />
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <HostDashboard />
                </ProtectedRoute>
              }
            />

            {/* Space Management Routes */}
            <Route
              path="/my-spaces"
              element={
                <ProtectedRoute>
                  <MySpaces />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spaces/create"
              element={
                <ProtectedRoute>
                  <SpaceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spaces/:spaceId"
              element={
                <ProtectedRoute>
                  <SpaceDetails />
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
            <Route
              path="/spaces/:spaceId/edit"
              element={
                <ProtectedRoute>
                  <SpaceForm />
                </ProtectedRoute>
              }
            />

            {/* Tenant Routes */}
            <Route
              path="/tenant-management"
              element={
                <ProtectedRoute>
                  <TenantManagement />
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
            <Route
              path="/tenants/:tenantId"
              element={
                <ProtectedRoute>
                  <TenantDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;