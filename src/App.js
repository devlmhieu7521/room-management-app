import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import SpaceRedirectPage from './pages/spaces/SpaceRedirectPage';
import ApartmentListPage from './pages/spaces/apartments/ApartmentListPage';
import CreateApartmentPage from './pages/spaces/apartments/CreateApartmentPage';
import EditApartmentPage from './pages/spaces/apartments/EditApartmentPage';
import ApartmentDetailPage from './pages/spaces/apartments/ApartmentDetailPage';
import BoardingHouseListPage from './pages/spaces/boarding-houses/BoardingHouseListPage';
import CreateBoardingHousePage from './pages/spaces/boarding-houses/CreateBoardingHousePage';
import EditBoardingHousePage from './pages/spaces/boarding-houses/EditBoardingHousePage';
import BoardingHouseDetailPage from './pages/spaces/boarding-houses/BoardingHouseDetailPage';
import CreateRoomPage from './pages/spaces/boarding-houses/rooms/CreateRoomPage';
import RoomDetailPage from './pages/spaces/boarding-houses/rooms/RoomDetailPage';
import EditRoomPage from './pages/spaces/boarding-houses/rooms/EditRoomPage';
import NotFound from './pages/NotFound';
import MainLayout from './components/layout/MainLayout';
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
          <Route path="spaces" element={<SpaceRedirectPage />} />

          {/* Apartment Routes */}
          <Route path="spaces/apartments" element={<ApartmentListPage />} />
          <Route path="spaces/apartments/create" element={<CreateApartmentPage />} />
          <Route path="spaces/apartments/:id" element={<ApartmentDetailPage />} />
          <Route path="spaces/apartments/edit/:id" element={<EditApartmentPage />} />

          {/* Boarding House Routes */}
          <Route path="spaces/boarding-houses" element={<BoardingHouseListPage />} />
          <Route path="spaces/boarding-houses/create" element={<CreateBoardingHousePage />} />
          <Route path="spaces/boarding-houses/:id" element={<BoardingHouseDetailPage />} />
          <Route path="spaces/boarding-houses/edit/:id" element={<EditBoardingHousePage />} />

          {/* Boarding House Room Routes */}
          <Route path="spaces/boarding-houses/:id/rooms/create" element={<CreateRoomPage />} />
          <Route path="spaces/boarding-houses/:id/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="spaces/boarding-houses/:id/rooms/:roomId/edit" element={<EditRoomPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;