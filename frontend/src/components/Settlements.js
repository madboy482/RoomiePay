import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettlementHistory, processPayment, finalizeGroupSplits } from '../services/api';
import PaymentPortal from './PaymentPortal';

const CurrentDateTime = () => {
    const [dateTime, setDateTime] = useState('2025-05-05 04:57:23');
    
    useEffect(() => {
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

    useEffect(() => {
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
            Welcome, {userName}
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-teal-200"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
        </div>
    </div>
);

const Settlements = ({ groupId }) => {
    const [settlements, setSettlements] = useState([]);
    const [showPaymentPortal, setShowPaymentPortal] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFinalizedModal, setShowFinalizedModal] = useState(false);
    const [finalizedSettlements, setFinalizedSettlements] = useState([]);

    useEffect(() => {
        loadSettlements();
    }, [groupId]);

    const loadSettlements = async () => {
        try {
            setLoading(true);
            const response = await getSettlementHistory();
            setSettlements(response.data);
        } catch (err) {
            console.error('Error loading settlements:', err);
            setError('Failed to load settlements');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = (settlement) => {
        setSelectedSettlement(settlement);
        setShowPaymentPortal(true);
    };

    const handleFinalizeSplits = async () => {
        try {
            const settlements = await finalizeGroupSplits(groupId, true);
            setFinalizedSettlements(settlements);
            setShowFinalizedModal(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Error finalizing splits');
        }
    };

    const handlePaymentComplete = () => {
        setShowPaymentPortal(false);
        loadSettlements();
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString();
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            Settlements
                        </h1>
                        <div className="flex items-center gap-4">
                            <UserInfo />
                            <div className="w-px h-4 bg-slate-300" />
                            <CurrentDateTime />
                        </div>
                    </div>

                    {groupId && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 group"
                            onClick={handleFinalizeSplits}
                        >
                            <span className="flex items-center gap-2">
                                Finalize Splits
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </span>
                        </motion.button>
                    )}
                </div>

                {/* Error Alert */}
                <AnimatePresence>
                    {error && !showPaymentPortal && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 px-6 py-4 rounded-lg relative mb-6"
                            role="alert"
                        >
                            <span className="block sm:inline">{error}</span>
                            <button
                                className="absolute top-0 right-0 px-4 py-3"
                                onClick={() => setError('')}
                            >
                                <svg className="fill-current h-6 w-6 text-red-500" role="button" viewBox="0 0 20 20">
                                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                                </svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {settlements.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No settlements found
                                        </td>
                                    </tr>
                                ) : (
                                    settlements.map((settlement) => (
                                        <motion.tr
                                            key={settlement.SettlementID}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="hover:bg-gray-50/50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.GroupName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.PayerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.ReceiverName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${settlement.Amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(settlement.DueDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    settlement.Status === 'Pending' ? 'bg-yellow-100/80 text-yellow-800' :
                                                    settlement.Status === 'Confirmed' ? 'bg-green-100/80 text-green-800' :
                                                    'bg-gray-100/80 text-gray-800'
                                                }`}>
                                                    {settlement.Status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {settlement.Status === 'Pending' && (
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-medium py-1 px-3 rounded-lg hover:shadow-md transition-all duration-300"
                                                        onClick={() => handlePayment(settlement)}
                                                    >
                                                        Pay Now
                                                    </motion.button>
                                                )}
                                                {settlement.Status === 'Confirmed' && (
                                                    <span className="text-green-600">
                                                        Paid on {formatDate(settlement.PaymentDate)}
                                                    </span>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Finalized Settlements Modal */}
                <AnimatePresence>
                    {showFinalizedModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4"
                            >
                                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h3 className="text-xl font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                                        Finalized Settlements
                                    </h3>
                                    <button 
                                        className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                                        onClick={() => setShowFinalizedModal(false)}
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Modal Content */}
                                <div className="p-6">
                                    {finalizedSettlements.length === 0 ? (
                                        <div className="bg-blue-100/80 backdrop-blur-sm border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg" role="alert">
                                            <p>No settlements to finalize.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                {/* Table Headers */}
                                                <thead className="bg-gray-50/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                {/* Table Body */}
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {finalizedSettlements.map((settlement) => (
                                                        <motion.tr
                                                            key={settlement.SettlementID}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="hover:bg-gray-50/50"
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.PayerName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.ReceiverName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${settlement.Amount.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(settlement.DueDate)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-medium py-1 px-3 rounded-lg hover:shadow-md transition-all duration-300"
                                                                    onClick={() => {
                                                                        setShowFinalizedModal(false);
                                                                        handlePayment(settlement);
                                                                    }}
                                                                >
                                                                    Pay Now
                                                                </motion.button>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-all duration-300"
                                        onClick={() => setShowFinalizedModal(false)}
                                    >
                                        Close
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Payment Portal */}
                <PaymentPortal
                    open={showPaymentPortal}
                    onClose={() => setShowPaymentPortal(false)}
                    settlement={selectedSettlement}
                    onPaymentComplete={handlePaymentComplete}
                />
            </div>
        </div>
    );
};

export default Settlements;