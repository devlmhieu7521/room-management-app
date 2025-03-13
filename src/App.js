import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import SpaceListPage from './pages/spaces/SpaceListPage';
import CreateSpacePage from './pages/spaces/CreateSpacePage';
import EditSpacePage from './pages/spaces/EditSpacePage';
import SpaceDetailPage from './pages/spaces/SpaceDetailPage';
import NotFound from './pages/NotFound';
import MainLayout from './components/layout/MainLayout';
import authService from './services/authService';
import './styles/global.css';
import './styles/space.css';
import './styles/modal.css';
import './styles/page.css';
import './styles/space-detail.css';
import './styles/meter-readings.css';
// Import new room management styles
import './styles/room-management.css';

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
          <Route path="spaces" element={<SpaceListPage />} />
          <Route path="spaces/create" element={<CreateSpacePage />} />
          <Route path="spaces/detail/:id" element={<SpaceDetailPage />} />
          <Route path="spaces/edit/:id" element={<EditSpacePage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;