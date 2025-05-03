import React, { useState, useEffect } from 'react';
import { processPayment } from '../services/api';

const PaymentPortal = ({ open, onClose, settlement, onPaymentComplete }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [upiId, setUpiId] = useState('');
    
    useEffect(() => {
        // Reset form fields when the modal opens
        if (open) {
            setSelectedMethod('');
            setCardNumber('');
            setCardName('');
            setExpiryDate('');
            setCvv('');
            setUpiId('');
            setSuccess(false);
            setLoading(false);
        }
    }, [open]);

    if (!open || !settlement) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await processPayment(settlement.SettlementID, settlement.Amount);
            console.log('Payment processed successfully:', response.data);
            
            setLoading(false);
            setSuccess(true);
            
            // Wait a brief moment to show success message before closing
            setTimeout(() => {
                if (onPaymentComplete) {
                    onPaymentComplete(settlement.SettlementID, true);
                }
                onClose();
            }, 2000);
            
        } catch (error) {
            console.error('Payment failed:', error);
            setLoading(false);
            alert('Payment processing failed: ' + (error.response?.data?.detail || 'Unknown error'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Payment Portal</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <span className="sr-only">Close</span>
                        ×
                    </button>
                </div>

                <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                    <div className="mb-2">
                        <p className="font-medium">Payment to: {settlement.ReceiverName}</p>
                        <p className="text-lg font-bold">${Number(settlement.Amount).toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-gray-600">Due by: {new Date(settlement.DueDate).toLocaleDateString()}</p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center p-8">
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <p className="mt-4 text-lg font-medium text-gray-700">Payment Successful!</p>
                        <p className="mt-2 text-sm text-gray-600">Your balances will be updated automatically.</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-lg font-medium text-gray-700">Processing payment...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-1">
                                Payment Method
                            </label>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    className={`flex-1 px-4 py-2 rounded-md ${selectedMethod === 'card' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 border border-gray-300'}`}
                                    onClick={() => setSelectedMethod('card')}
                                >
                                    Credit/Debit Card
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 px-4 py-2 rounded-md ${selectedMethod === 'upi' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100 border border-gray-300'}`}
                                    onClick={() => setSelectedMethod('upi')}
                                >
                                    UPI
                                </button>
                            </div>
                        </div>

                        {selectedMethod === 'card' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">
                                        Card Number
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="1234 5678 9012 3456"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">
                                        Name on Card
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="John Doe"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-gray-700 text-sm font-medium mb-1">
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="MM/YY"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-gray-700 text-sm font-medium mb-1">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="123"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedMethod === 'upi' && (
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">
                                    UPI ID
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="name@upi"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={!selectedMethod}
                                className={`w-full py-2 rounded-md ${
                                    selectedMethod 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Pay ${Number(settlement.Amount).toFixed(2)}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PaymentPortal;