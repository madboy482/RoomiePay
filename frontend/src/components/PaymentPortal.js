import React, { useState } from 'react';
import { processPayment } from '../services/api';

const PaymentPortal = ({ open, onClose, settlement, onPaymentComplete }) => {
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handlePaymentSubmit = async () => {
        setLoading(true);
        setError('');
        
        try {
            await processPayment(settlement.SettlementID, settlement.Amount);
            setShowConfirmation(true);
            if (onPaymentComplete) {
                onPaymentComplete();
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPaymentMethod('upi');
        setPaymentDetails('');
        setError('');
        setShowConfirmation(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!settlement) return null;
    if (!open) return null;

    // Convert Amount to number for toFixed
    const amount = Number(settlement.Amount);

    if (showConfirmation) {
        return (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                    <div className="p-6 text-center">
                        <h2 className="text-xl font-semibold text-green-600 mb-2">
                            Payment Successful!
                        </h2>
                        <p className="text-lg mb-1">
                            Amount: ${amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </p>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
                            onClick={handleClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold">Payment Details</h2>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Payment Summary */}
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold mb-3">
                                Payment Summary
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <p className="text-gray-500 text-sm">
                                        You owe:
                                    </p>
                                    <p className="text-2xl font-bold text-red-600">
                                        ${amount.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">
                                        To:
                                    </p>
                                    <p className="font-medium">
                                        {settlement.ReceiverName}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">
                                        Due Date:
                                    </p>
                                    <p className={new Date(settlement.DueDate) < new Date() ? "text-red-600" : ""}>
                                        {new Date(settlement.DueDate).toLocaleDateString()}
                                        {new Date(settlement.DueDate) < new Date() && " (Overdue)"}
                                    </p>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <p className="text-gray-500 text-sm">
                                        Group:
                                    </p>
                                    <p>
                                        {settlement.GroupName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div>
                            <fieldset>
                                <legend className="text-sm font-medium text-gray-700 mb-2">Select Payment Method</legend>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            checked={paymentMethod === 'upi'}
                                            onChange={() => setPaymentMethod('upi')}
                                        />
                                        <span className="ml-2">UPI Payment</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => setPaymentMethod('card')}
                                        />
                                        <span className="ml-2">Credit/Debit Card</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            checked={paymentMethod === 'netbanking'}
                                            onChange={() => setPaymentMethod('netbanking')}
                                        />
                                        <span className="ml-2">Net Banking</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            checked={paymentMethod === 'wallet'}
                                            onChange={() => setPaymentMethod('wallet')}
                                        />
                                        <span className="ml-2">Digital Wallet</span>
                                    </label>
                                </div>
                            </fieldset>
                        </div>

                        {/* Payment Details Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {paymentMethod === 'upi' ? 'Enter UPI ID' :
                                 paymentMethod === 'card' ? 'Enter Card Number' :
                                 paymentMethod === 'netbanking' ? 'Enter Bank Account Number' :
                                 'Enter Wallet ID'}
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={paymentDetails}
                                onChange={(e) => setPaymentDetails(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button 
                        className="px-4 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-100 focus:outline-none"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md font-medium ${loading || !paymentDetails ? 
                            'bg-blue-400 text-white cursor-not-allowed' : 
                            'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        onClick={handlePaymentSubmit}
                        disabled={loading || !paymentDetails}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>Pay ${amount.toFixed(2)}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPortal;