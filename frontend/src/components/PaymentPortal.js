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
    const [error, setError] = useState('');
    
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
            setError('');
        }
    }, [open]);

    if (!open || !settlement) return null;

    const formatCardNumber = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Add space after every 4 digits
        const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        // Limit to 19 characters (16 digits + 3 spaces)
        return formatted.slice(0, 19);
    };

    const formatExpiryDate = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Format as MM/YY
        if (digits.length > 2) {
            return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
        }
        return digits;
    };

    const formatCVV = (value) => {
        // Remove all non-digits and limit to 3-4 digits
        return value.replace(/\D/g, '').slice(0, 4);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
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
            setError(error.response?.data?.detail || 'Payment processing failed. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        Payment Portal
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-slate-500 hover:text-teal-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-lg border border-teal-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="mb-2 relative">
                        <p className="font-medium text-slate-700">Payment to: <span className="font-semibold text-slate-800">{settlement.ReceiverName}</span></p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            ${Number(settlement.Amount).toFixed(2)}
                        </p>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due by: {new Date(settlement.DueDate).toLocaleDateString()}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 px-6 py-4 rounded-lg relative mb-6" role="alert">
                        <span className="block sm:inline">{error}</span>
                        <button 
                            className="absolute top-0 right-0 px-4 py-3"
                            onClick={() => setError('')}
                        >
                            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <title>Close</title>
                                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                            </svg>
                        </button>
                    </div>
                )}

                {success ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full blur-sm"></div>
                            <div className="relative bg-gradient-to-r from-teal-500 to-emerald-500 p-4 rounded-full">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                        </div>
                        <p className="mt-6 text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            Payment Successful!
                        </p>
                        <p className="mt-2 text-slate-600">Your balances will be updated automatically.</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full blur-sm opacity-50"></div>
                            <div className="relative h-16 w-16 flex items-center justify-center">
                                <div className="absolute h-16 w-16 border-4 border-t-teal-500 border-b-emerald-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                                <div className="absolute h-12 w-12 border-4 border-t-transparent border-b-transparent border-l-teal-400 border-r-emerald-400 rounded-full animate-spin animate-reverse"></div>
                            </div>
                        </div>
                        <p className="mt-6 text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            Processing Payment
                        </p>
                        <p className="mt-2 text-slate-600">Please wait while we confirm your transaction...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-slate-600 text-sm font-medium mb-2">
                                Select Payment Method
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    className={`group relative p-4 rounded-lg transition-all duration-300 ${
                                        selectedMethod === 'card' 
                                            ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-200' 
                                            : 'bg-white/50 border border-slate-200 hover:border-teal-200'
                                    }`}
                                    onClick={() => setSelectedMethod('card')}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedMethod === 'card' ? 'opacity-100' : ''}`} />
                                    <div className="flex flex-col items-center relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mb-2 ${selectedMethod === 'card' ? 'text-teal-600' : 'text-slate-500 group-hover:text-teal-600'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        <span className={`text-sm font-medium ${selectedMethod === 'card' ? 'text-teal-700' : 'text-slate-600'}`}>Card</span>
                                    </div>
                                </button>
                                
                                <button
                                    type="button"
                                    className={`group relative p-4 rounded-lg transition-all duration-300 ${
                                        selectedMethod === 'upi' 
                                            ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-200' 
                                            : 'bg-white/50 border border-slate-200 hover:border-teal-200'
                                    }`}
                                    onClick={() => setSelectedMethod('upi')}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedMethod === 'upi' ? 'opacity-100' : ''}`} />
                                    <div className="flex flex-col items-center relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mb-2 ${selectedMethod === 'upi' ? 'text-teal-600' : 'text-slate-500 group-hover:text-teal-600'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span className={`text-sm font-medium ${selectedMethod === 'upi' ? 'text-teal-700' : 'text-slate-600'}`}>UPI</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {selectedMethod === 'card' && (
                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                    <input
                                        id="cardNumber"
                                        className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                        type="text"
                                        placeholder="Card Number"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        required
                                    />
                                    <label
                                        htmlFor="cardNumber"
                                        className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                                 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                                 peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                                 peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                    >
                                        Card Number
                                    </label>
                                </div>
                                
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                    <input
                                        id="cardName"
                                        className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                        type="text"
                                        placeholder="Name on Card"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        required
                                    />
                                    <label
                                        htmlFor="cardName"
                                        className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                                 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                                 peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                                 peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                    >
                                        Name on Card
                                    </label>
                                </div>
                                
                                <div className="flex space-x-4">
                                    <div className="relative group flex-1">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                        <input
                                            id="expiryDate"
                                            className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                            type="text"
                                            placeholder="MM/YY"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                                            required
                                        />
                                        <label
                                            htmlFor="expiryDate"
                                            className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                                     peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                                     peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                                     peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                        >
                                            Expiry Date
                                        </label>
                                    </div>
                                    
                                    <div className="relative group w-32">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                        <input
                                            id="cvv"
                                            className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                            type="text"
                                            placeholder="CVV"
                                            value={cvv}
                                            onChange={(e) => setCvv(formatCVV(e.target.value))}
                                            required
                                        />
                                        <label
                                            htmlFor="cvv"
                                            className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                                     peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                                     peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                                     peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                        >
                                            CVV
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedMethod === 'upi' && (
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                <input
                                    id="upiId"
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                    type="text"
                                    placeholder="UPI ID"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    required
                                />
                                <label
                                    htmlFor="upiId"
                                    className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                             peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                             peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                             peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                >
                                    UPI ID
                                </label>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={!selectedMethod}
                            className={`relative w-full overflow-hidden ${!selectedMethod ? 'opacity-60 cursor-not-allowed' : 'group'}`}
                        >
                            <div className={`absolute inset-0 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-[400ms] ease-out ${selectedMethod ? 'group-hover:w-full' : ''}`} />
                            <div className="relative px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                                <span className="flex items-center justify-center gap-2 text-white font-semibold">
                                    Pay ${Number(settlement.Amount).toFixed(2)}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </div>
                        </button>
                        
                        <div className="text-center">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="mt-2 text-slate-600 hover:text-teal-600 transition-colors text-sm font-medium"
                            >
                                Cancel Payment
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PaymentPortal;