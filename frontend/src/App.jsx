import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import AddFood from './Pages/AddFood';
import Notification from './Pages/Notification';
import LocationSelector from './component/LocationSelector';

const App = () => {
  return (
    <div className="w-full h-screen">
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/addfood" element={<AddFood />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/location" element={<LocationSelector />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
};

export default App;
