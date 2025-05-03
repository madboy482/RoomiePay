import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Group from './components/Group';
import Notifications from './components/Notifications';
import Settlements from './components/Settlements';
import ProfileMenu from './components/ProfileMenu';
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PrivateLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) return <Navigate to="/login" />;
  
  return (
    <div className="w-full">
      <nav className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold flex-grow">
              RoomiePay
            </h1>
            <div className="flex space-x-4">
              <a 
                href="/dashboard" 
                className="px-3 py-2 text-white hover:bg-blue-700 rounded-md"
              >
                Dashboard
              </a>
              <a 
                href="/settlements" 
                className="px-3 py-2 text-white hover:bg-blue-700 rounded-md"
              >
                Settlements
              </a>
              <div className="flex items-center gap-4">
                <Notifications />
                <ProfileMenu />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateLayout>
              <Dashboard />
            </PrivateLayout>
          } 
        />
        <Route 
          path="/group/:groupId" 
          element={
            <PrivateLayout>
              <Group />
            </PrivateLayout>
          } 
        />
        <Route 
          path="/settlements" 
          element={
            <PrivateLayout>
              <Settlements />
            </PrivateLayout>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;