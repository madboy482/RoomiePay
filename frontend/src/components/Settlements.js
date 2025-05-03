import React, { useState, useEffect } from 'react';
import { getSettlementHistory, processPayment, finalizeGroupSplits } from '../services/api';
import PaymentPortal from './PaymentPortal';

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
        loadSettlements(); // Refresh the settlements list
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString();
    };

    if (loading) {
        return <div>Loading settlements...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">All Settlements</h2>
                {groupId && (
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                        onClick={handleFinalizeSplits}
                    >
                        Finalize Splits
                    </button>
                )}
            </div>

            {error && !showPaymentPortal && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <button
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        onClick={() => setError('')}
                    >
                        <span className="sr-only">Close</span>
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                        </svg>
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
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
                            <tbody className="bg-white divide-y divide-gray-200">
                                {settlements.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No settlements found
                                        </td>
                                    </tr>
                                ) : (
                                    settlements.map((settlement) => (
                                        <tr key={settlement.SettlementID} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.GroupName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.PayerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.ReceiverName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${settlement.Amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(settlement.DueDate)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    settlement.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    settlement.Status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {settlement.Status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {settlement.Status === 'Pending' && (
                                                    <button 
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded"
                                                        onClick={() => handlePayment(settlement)}
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                                {settlement.Status === 'Confirmed' && (
                                                    <span className="text-green-600">
                                                        Paid on {formatDate(settlement.PaymentDate)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Finalized Settlements Modal */}
            {showFinalizedModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-900">Finalized Settlements</h3>
                            <button 
                                className="text-gray-400 hover:text-gray-500"
                                onClick={() => setShowFinalizedModal(false)}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {finalizedSettlements.length === 0 ? (
                                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                                    <p>No settlements to finalize.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {finalizedSettlements.map((settlement) => (
                                                <tr key={settlement.SettlementID} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.PayerName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.ReceiverName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${settlement.Amount.toFixed(2)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(settlement.DueDate)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <button
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded"
                                                            onClick={() => {
                                                                setShowFinalizedModal(false);
                                                                handlePayment(settlement);
                                                            }}
                                                        >
                                                            Pay Now
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button 
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                                onClick={() => setShowFinalizedModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Portal */}
            <PaymentPortal
                open={showPaymentPortal}
                onClose={() => setShowPaymentPortal(false)}
                settlement={selectedSettlement}
                onPaymentComplete={handlePaymentComplete}
            />
        </div>
    );
};

export default Settlements;