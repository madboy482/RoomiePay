import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
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
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RoomiePay
          </Typography>
          <Button color="inherit" href="/dashboard">Dashboard</Button>
          <Button color="inherit" href="/settlements">Settlements</Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Notifications />
            <ProfileMenu />
          </Box>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
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
