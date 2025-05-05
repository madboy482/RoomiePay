import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Group from './components/Group';
import Notifications from './components/Notifications';
import Settlements from './components/Settlements';
import ProfileMenu from './components/ProfileMenu';
import './App.css';

const NavLink = ({ to, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <a 
      href={to} 
      className={`relative px-4 py-2 rounded-lg font-medium group transition-all duration-300
        ${isActive 
          ? 'text-teal-600 bg-teal-50/50 shadow-sm' 
          : 'text-slate-600 hover:text-teal-600'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="relative z-10">{children}</span>
      <div className={`absolute inset-0 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg 
        transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      {isActive && (
        <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
      )}
    </a>
  );
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PrivateLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!token) return <Navigate to="/login" />;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled 
          ? 'bg-white/90 backdrop-blur-xl shadow-lg' 
          : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute inset-0.5 bg-white rounded-lg" />
                <svg xmlns="http://www.w3.org/2000/svg" 
                     className="h-8 w-8 absolute inset-1 text-teal-500 group-hover:scale-110 transition-transform duration-300" 
                     fill="none" 
                     viewBox="0 0 24 24" 
                     stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent
                           group-hover:from-emerald-600 group-hover:to-teal-600 transition-all duration-300">
                RoomiePay
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/settlements">Settlements</NavLink>
              
              {/* Actions Section */}
              <div className="flex items-center gap-6 ml-6">
                {/* Gradient Separator */}
                <div className="h-8 w-px bg-gradient-to-b from-teal-200/0 via-teal-200/50 to-teal-200/0"></div>
                
                {/* Actions Container */}
                <div className="flex items-center gap-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20
                              shadow-lg shadow-teal-500/5 hover:shadow-teal-500/10 transition-all duration-300">
                  {/* Notifications */}
                  <div className="relative group z-0">
                    <div className="p-2 rounded-lg hover:bg-gradient-to-r from-teal-50 to-emerald-50 transition-all duration-300">
                      <Notifications />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-lg 
                                  opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
                  </div>
                  
                  {/* Profile Menu */}
                  <div className="relative z-50">
                    <ProfileMenu />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Border Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent opacity-50" />
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-16">
        {children}
      </main>

      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Larger, More Vibrant Gradient Circles */}
        <div className="absolute top-0 -left-4 w-[40rem] h-[40rem] bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute -bottom-8 -right-4 w-[45rem] h-[45rem] bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -top-8 right-1/3 w-[42rem] h-[42rem] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        
        {/* Additional Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,128,128,0.1),transparent_70%)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,128,128,0.03)_20px,rgba(0,128,128,0.03)_40px)]" />
        </div>
      </div>
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