import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/layout/MainLayout';
import NotFound from './pages/NotFound';

// Import apartment pages
import ApartmentListPage from './pages/spaces/apartments/ApartmentListPage';
import CreateApartmentPage from './pages/spaces/apartments/CreateApartmentPage';
import EditApartmentPage from './pages/spaces/apartments/EditApartmentPage';
import ApartmentDetailPage from './pages/spaces/apartments/ApartmentDetailPage';

// Import boarding house pages
import BoardingHouseListPage from './pages/spaces/boarding-houses/BoardingHouseListPage';
import CreateBoardingHousePage from './pages/spaces/boarding-houses/CreateBoardingHousePage';
import EditBoardingHousePage from './pages/spaces/boarding-houses/EditBoardingHousePage';
import BoardingHouseDetailPage from './pages/spaces/boarding-houses/BoardingHouseDetailPage';

// Import room pages
import CreateRoomPage from './pages/spaces/boarding-houses/rooms/CreateRoomPage';
import RoomDetailPage from './pages/spaces/boarding-houses/rooms/RoomDetailPage';
import EditRoomPage from './pages/spaces/boarding-houses/rooms/EditRoomPage';

import TenantListPage from './pages/tenants/TenantListPage';
import AddTenantPage from './pages/tenants/AddTenantPage';
import EditTenantPage from './pages/tenants/EditTenantPage';
import TenantDetailPage from './pages/tenants/TenantDetailPage';

// Import services
import authService from './services/authService';

// Import styles
import './styles/global.css';
import './styles/space.css';
import './styles/modal.css';
import './styles/page.css';
import './styles/space-detail.css';
import './styles/meter-readings.css';
import './styles/room-management.css';
import './styles/boarding-house-styles.css';
import './styles/space-list-switcher.css';
import './styles/breadcrumb.css';
import './styles/tenant.css'; // General tenant styles
import './styles/TenantForm.css'; // Tenant form styles
import './styles/TenantDetail.css'; // Tenant detail styles
import './styles/TenantList.css'; // Tenant list styles
import './styles/SpaceTenantsTab.css'; // Space tenants tab styles

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Space Management Routes */}
          <Route path="spaces">
            {/* Redirect from /spaces to /spaces/apartments by default */}
            <Route index element={<Navigate to="/spaces/apartments" replace />} />

            {/* Apartment Routes */}
            <Route path="apartments">
              <Route index element={<ApartmentListPage />} />
              <Route path="create" element={<CreateApartmentPage />} />
              <Route path=":id" element={<ApartmentDetailPage />} />
              <Route path="edit/:id" element={<EditApartmentPage />} />
            </Route>

            {/* Boarding House Routes */}
            <Route path="boarding-houses">
              <Route index element={<BoardingHouseListPage />} />
              <Route path="create" element={<CreateBoardingHousePage />} />
              <Route path=":id" element={<BoardingHouseDetailPage />} />
              <Route path="edit/:id" element={<EditBoardingHousePage />} />

              {/* Boarding House Room Routes */}
                <Route path=":id/rooms">
                <Route path="create" element={<CreateRoomPage />} />
                <Route path=":roomId" element={<RoomDetailPage />} />
                <Route path=":roomId/edit" element={<EditRoomPage />} />
                </Route>
            </Route>
          </Route>
          {/* Tenant Management Routes */}
          <Route path="tenants">
            <Route index element={<TenantListPage />} />
            <Route path="add" element={<AddTenantPage />} />
            <Route path=":id" element={<TenantDetailPage />} />
            <Route path="edit/:id" element={<EditTenantPage />} />
            </Route>
          </Route>
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;