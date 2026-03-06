import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Pages/Home';
import AddFood from './Pages/AddFood';
import Notification from './Pages/Notification';
import LocationSelector from './component/LocationSelector';
import SignUp from './Pages/SignUp';
import Login from './Pages/Login';
import Map from './Pages/map';
import { isAuthenticated } from './api/auth';

/** Wraps routes that require a valid JWT. Redirects to /login otherwise. */
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <div className="w-full h-screen">
      <Routes>
        {/* Public routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/addfood" element={<ProtectedRoute><AddFood /></ProtectedRoute>} />
        <Route path="/notification" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
        <Route path="/location" element={<ProtectedRoute><LocationSelector /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />

        {/* Default: authenticated users → /home, guests → /login */}
        <Route path="/" element={<Navigate to={isAuthenticated() ? '/home' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated() ? '/home' : '/login'} replace />} />
      </Routes>
    </div>
  );
};

export default App;


