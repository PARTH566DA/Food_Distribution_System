import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Pages/Home';
import AddFood from './Pages/AddFood';
import Notification from './Pages/Notification';
import LocationSelector from './component/LocationSelector';
import SignUp from './Pages/SignUp';
import Login from './Pages/Login';
import Map from './Pages/map';
import Admin from './Pages/Admin';
import History from './Pages/History';
import { isAuthenticated } from './api/auth';

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <div className="w-full h-screen">
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/addfood" element={<ProtectedRoute><AddFood /></ProtectedRoute>} />
        <Route path="/notification" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
        <Route path="/location" element={<ProtectedRoute><LocationSelector /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

        <Route path="/admin" element={<Admin />} />

        <Route path="/" element={<Navigate to={isAuthenticated() ? '/home' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated() ? '/home' : '/login'} replace />} />
      </Routes>
    </div>
  );
};

export default App;


