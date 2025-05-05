import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CurrentDateTime = () => {
    const [dateTime, setDateTime] = useState('2025-05-05 05:02:14');
    
    React.useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
            setDateTime(formatted);
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {dateTime} UTC
        </div>
    );
};

const UserInfo = () => {
    const [userName, setUserName] = useState('renukag77');

    React.useEffect(() => {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            setUserName(userData.Name || userData.Email);
        }
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {userName}
        </div>
    );
};

const SettlementConfig = ({ open, onClose, onSave }) => {
    const [period, setPeriod] = useState('1d');
    const [customValue, setCustomValue] = useState('1');
    const [timeUnit, setTimeUnit] = useState('d');

    const handleSave = () => {
        if (period === 'custom') {
            onSave(`${customValue}${timeUnit}`);
        } else {
            onSave(period);
        }
        onClose();
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200/80">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                                Configure Settlement Period
                            </h2>
                            <div className="flex items-center gap-4 mt-2">
                                <UserInfo />
                                <div className="w-px h-4 bg-slate-300" />
                                <CurrentDateTime />
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="relative group">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Settlement Period
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white/50 hover:bg-white 
                                                 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                                                 transition-all duration-200"
                                        value={period}
                                        onChange={(e) => setPeriod(e.target.value)}
                                    >
                                        <option value="1h">Every Hour</option>
                                        <option value="1d">Daily</option>
                                        <option value="1w">Weekly</option>
                                        <option value="1m">Monthly</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                </div>
                            </div>

                            <AnimatePresence>
                                {period === 'custom' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div className="relative group">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Value
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white/50 hover:bg-white 
                                                             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                                                             transition-all duration-200"
                                                    value={customValue}
                                                    onChange={(e) => setCustomValue(e.target.value)}
                                                />
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Unit
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white/50 hover:bg-white 
                                                             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                                                             transition-all duration-200"
                                                    value={timeUnit}
                                                    onChange={(e) => setTimeUnit(e.target.value)}
                                                >
                                                    <option value="h">Hours</option>
                                                    <option value="d">Days</option>
                                                    <option value="w">Weeks</option>
                                                    <option value="m">Months</option>
                                                </select>
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-6 border-t border-slate-200/80 flex justify-end gap-4">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-6 py-2 text-slate-600 hover:text-teal-600 font-medium rounded-lg 
                                         transition-colors duration-200"
                                onClick={onClose}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 
                                         text-white font-medium rounded-lg group overflow-hidden"
                                onClick={handleSave}
                            >
                                <div className="absolute inset-0 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 
                                              transition-all duration-[400ms] ease-out group-hover:w-full" />
                                <span className="relative">Save Changes</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SettlementConfig;