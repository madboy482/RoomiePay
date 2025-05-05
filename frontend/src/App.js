import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Group from './components/Group';
import Notifications from './components/Notifications';
import Settlements from './components/Settlements';
import ProfileMenu from './components/ProfileMenu';
import './App.css';

// Custom NavLink component with enhanced animations
const NavLink = ({ to, children, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const linkRef = useRef(null);
  
  // Interactive hover animation
  const [hovered, setHovered] = useState(false);
  
  return (
    <Link 
      ref={linkRef}
      to={to} 
      className={`relative px-5 py-2.5 rounded-lg font-medium group transition-all duration-300 flex items-center gap-2
        ${isActive 
          ? 'text-teal-600 shadow-sm' 
          : 'text-slate-600 hover:text-teal-600'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background animation */}
      <AnimatePresence>
        {(isActive || hovered) && (
          <motion.div 
            className="absolute inset-0 rounded-lg z-0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              background: isActive 
                ? 'linear-gradient(to right, rgba(204, 251, 241, 0.6), rgba(209, 250, 229, 0.6))' 
                : 'linear-gradient(to right, rgba(204, 251, 241, 0.3), rgba(209, 250, 229, 0.3))'
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      
      {/* Icon */}
      {icon && (
        <motion.div 
          animate={{ 
            scale: hovered ? 1.2 : 1,
            rotate: hovered ? 5 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="text-teal-500"
        >
          {icon}
        </motion.div>
      )}
      
      {/* Text content */}
      <span className="relative z-10">{children}</span>
      
      {/* Active indicator line */}
      {isActive && (
        <motion.div 
          className="absolute -bottom-1 left-2 right-2 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500"
          layoutId="activeNavIndicator"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
};

// Weather component for nav bar
const WeatherWidget = () => {
  // In a real app, you'd fetch this from a weather API
  return (
    <motion.div 
      className="hidden md:flex items-center px-3 py-1.5 bg-gradient-to-r from-sky-100/50 to-teal-100/50 rounded-lg text-sm text-teal-700 font-medium"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <span>76°F</span>
    </motion.div>
  );
};

// Current time component for nav bar
const TimeWidget = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <motion.div 
      className="hidden md:flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-100/50 to-teal-100/50 rounded-lg text-sm text-teal-700 font-medium"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </motion.div>
  );
};

// Enhanced logo animation
const AnimatedLogo = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      className="flex items-center gap-3 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-10 h-10">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl"
          animate={{ 
            rotate: isHovered ? [0, 15, 0] : 6,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ 
            rotate: { duration: 0.6, ease: "easeInOut" },
            scale: { duration: 0.3 }
          }}
        />
        <motion.div 
          className="absolute inset-0.5 bg-white rounded-lg"
          animate={{ 
            scale: isHovered ? 0.9 : 1,
            opacity: isHovered ? 0.9 : 1
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8 absolute inset-1 text-teal-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          animate={{ 
            scale: isHovered ? 1.2 : 1,
            rotate: isHovered ? [0, -10, 10, 0] : 0
          }}
          transition={{ 
            scale: { duration: 0.3 },
            rotate: { duration: 0.6, ease: "easeInOut" }
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </motion.svg>
      </div>
      
      <motion.h1 
        className="text-2xl font-bold"
        animate={{
          background: isHovered 
            ? "linear-gradient(to right, #10b981, #0d9488)" 
            : "linear-gradient(to right, #0d9488, #10b981)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
        transition={{ duration: 0.3 }}
      >
        RoomiePay
      </motion.h1>
    </motion.div>
  );
};

// Search bar component for nav
const SearchBar = () => {
  const [focused, setFocused] = useState(false);
  
  return (
    <motion.div 
      className="hidden md:block relative"
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: "auto" }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <motion.div 
        className={`flex items-center pl-3 pr-1 py-1 bg-white/60 backdrop-blur-sm rounded-full 
          border transition-all duration-300 ${focused ? 'border-teal-400 shadow-sm' : 'border-transparent'}`}
        animate={{ 
          width: focused ? 240 : 200,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="w-full bg-transparent outline-none px-2 py-1 text-sm text-slate-700"
          placeholder="Search..."
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && (
          <motion.button 
            className="px-2 py-1 text-xs font-medium text-teal-600 bg-teal-50 rounded-full mr-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            Search
          </motion.button>
        )}
      </motion.div>
      
      {focused && (
        <motion.div 
          className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg p-2 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-slate-500 p-1">Try searching for expenses, groups, or friends...</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// Quick actions menu component
const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const actionItems = [
    { label: 'Add Expense', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
    { label: 'Create Group', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { label: 'Settle Up', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z' },
  ];
  
  return (
    <div className="relative">
      <motion.button
        className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2">
              {actionItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 rounded-md transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </motion.button>
              ))}
            </div>
            
            <motion.div 
              className="bg-gradient-to-r from-teal-50 to-emerald-50 p-2 border-t border-teal-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button className="flex items-center justify-center w-full px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
                View All Actions
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced scroll progress indicator
const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentProgress = window.scrollY;
      setScrollProgress((currentProgress / totalScroll) * 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <motion.div 
      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500"
      style={{ width: `${scrollProgress}%` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: scrollProgress > 0 ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
};

// Private layout with enhanced elements
const PrivateLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Page transition animation
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!token) return <Navigate to="/login" />;
  
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
      {/* Enhanced Navigation Bar */}
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
          ${scrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-lg py-2' 
            : 'bg-transparent py-4'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <AnimatedLogo />
            
            {/* Center Section */}
            <div className="hidden lg:flex items-center space-x-1">
              <NavLink 
                to="/dashboard" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                }
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/settlements" 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                }
              >
                Settlements
              </NavLink>
              <NavLink 
                to="/activity"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              >
                Activity
              </NavLink>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <SearchBar />
              
              {/* Weather & Time Widgets */}
              <div className="hidden lg:flex items-center space-x-2">
                <WeatherWidget />
                <TimeWidget />
              </div>
              
              {/* Actions Container */}
              <motion.div 
                className="flex items-center gap-3 p-1.5 rounded-xl bg-white/80 backdrop-blur-sm border border-teal-100/30
                         shadow-lg shadow-teal-500/5 hover:shadow-teal-500/10 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {/* Quick Actions */}
                <div className="relative z-20">
                  <QuickActions />
                </div>
                
                {/* Notifications */}
                <div className="relative z-20">
                  <Notifications />
                </div>
                
                {/* Separator Line */}
                <div className="h-6 w-px bg-gradient-to-b from-teal-200/0 via-teal-200/50 to-teal-200/0"></div>
                
                {/* Profile Menu */}
                <div className="relative z-20">
                  <ProfileMenu username={localStorage.getItem('username') || 'bunnysunny24'} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Bottom Border Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent opacity-50" />
        
        {/* Scroll Progress Indicator */}
        <ScrollProgress />
      </motion.nav>

      {/* Breadcrumbs */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white/60 backdrop-blur-sm shadow-sm border-b border-teal-100/30">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center text-sm text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-teal-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="mx-1">/</span>
          <motion.span 
            className="font-medium text-teal-700"
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1)}
          </motion.span>
        </motion.div>
      </div>

      {/* Page Content with Animation */}
      <motion.main 
        className="relative z-10 pt-28"
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.main>

      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Animated Gradient Circles */}
        <motion.div 
          className="absolute top-0 -left-4 w-[40rem] h-[40rem] bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute -bottom-8 -right-4 w-[45rem] h-[45rem] bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{ 
            duration: 30,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute -top-8 right-1/3 w-[42rem] h-[42rem] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ 
            x: [0, 20, 0],
            y: [0, -40, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        {/* Additional Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,128,128,0.1),transparent_70%)]" />
        
        {/* Grid Pattern */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,128,128,0.03)_20px,rgba(0,128,128,0.03)_40px)]" />
        </motion.div>
        
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => {
          const size = Math.random() * 5 + 2;
          const initialX = Math.random() * 100;
          const initialY = Math.random() * 100;
          
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-teal-300/30"
              style={{
                width: size,
                height: size,
                left: `${initialX}%`,
                top: `${initialY}%`,
              }}
              animate={{
                y: [0, Math.random() * 30 - 15],
                x: [0, Math.random() * 30 - 15],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 2,
              }}
            />
          );
        })}
      </div>
      
      {/* Mobile Navigation */}
      <motion.div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-teal-100 shadow-lg"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="flex justify-around items-center py-2">
          <Link to="/dashboard" className="p-2 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${location.pathname === '/dashboard' ? 'text-teal-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className={`text-xs mt-1 ${location.pathname === '/dashboard' ? 'text-teal-500 font-medium' : 'text-slate-500'}`}>Home</span>
          </Link>
          
          <Link to="/settlements" className="p-2 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${location.pathname === '/settlements' ? 'text-teal-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span className={`text-xs mt-1 ${location.pathname === '/settlements' ? 'text-teal-500 font-medium' : 'text-slate-500'}`}>Pay</span>
          </Link>
          
          <button className="p-2 flex flex-col items-center relative">
            <div className="absolute -top-5 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xs mt-7 text-slate-500">Add</span>
          </button>
          
          <Link to="/activity" className="p-2 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${location.pathname === '/activity' ? 'text-teal-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className={`text-xs mt-1 ${location.pathname === '/activity' ? 'text-teal-500 font-medium' : 'text-slate-500'}`}>Activity</span>
          </Link>
          
          <Link to="/profile" className="p-2 flex flex-col items-center">
            <div className="relative">
              <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-xs font-medium text-teal-600">BS</span>
              </div>
              {unreadNotifications && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
              )}
            </div>
            <span className={`text-xs mt-1 ${location.pathname === '/profile' ? 'text-teal-500 font-medium' : 'text-slate-500'}`}>Me</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

// Mock data for notifications
const unreadNotifications = true;

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
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
          <Route 
            path="/activity" 
            element={
              <PrivateLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-8">
                    Activity
                  </h1>
                  <p className="text-slate-600">Track your recent activities and transactions here.</p>
                </div>
              </PrivateLayout>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-8">
                    Profile
                  </h1>
                  <p className="text-slate-600">Manage your profile settings and preferences.</p>
                </div>
              </PrivateLayout>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;