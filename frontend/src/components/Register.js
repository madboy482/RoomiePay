import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

const Register = () => {
    const [currentDateTime, setCurrentDateTime] = useState('2025-05-05 03:36:45');
    const [userLogin] = useState('renukag77');
    const [formData, setFormData] = useState({
        Name: '',
        Email: '',
        Password: '',
        Phone: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const formatted = now.toISOString().replace('T', ' ').substring(0, 19);
            setCurrentDateTime(formatted);
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const createParticle = () => {
            const particle = document.createElement('div');
            const size = Math.random() * 15 + 5;
            const startPosition = Math.random() * window.innerWidth;
            const startTop = window.innerHeight + size;
            
            particle.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(to right, rgba(13, 148, 136, 0.2), rgba(5, 150, 105, 0.2));
                border-radius: 50%;
                pointer-events: none;
                left: ${startPosition}px;
                top: ${startTop}px;
                animation: floatUp 5s linear forwards;
            `;
            
            document.querySelector('.particles-container')?.appendChild(particle);
            setTimeout(() => particle.remove(), 5000);
        };

        const interval = setInterval(createParticle, 200);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await register(formData);
            navigate('/login');
            alert('Registration successful! Please login.');
        } catch (error) {
            alert('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
            {/* Header with DateTime and User Info */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-sm text-slate-600 bg-white/50 backdrop-blur-sm z-20 border-b border-white/20">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{currentDateTime} UTC</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{userLogin}</span>
                </div>
            </div>

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="particles-container absolute inset-0 z-0" />
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/30 to-white/80 z-0" />
                
                {/* Animated circles */}
                <div className="absolute top-0 -left-4 w-96 h-96 bg-teal-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
                <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-cyan-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute -top-8 right-96 w-96 h-96 bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
            </div>
                        {/* Main Content */}
                        <div className="relative flex justify-center items-center min-h-screen px-4 pt-16 z-10">
                <div className="w-full max-w-md transform transition-all duration-300 hover:scale-[1.01]">
                    <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-white/20">
                        {/* Card Header with Logo */}
                        <div className="relative mb-8">
                            {/* Container for the circle and its effects */}
                            <div className="relative w-24 h-24 mx-auto -mt-16">
                                {/* Blur effect container - positioned behind */}
                                <div 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full 
                                             bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full blur-xl opacity-50"
                                    style={{ transform: 'translate(-50%, -50%) translateZ(-10px)' }}
                                />
                                
                                {/* Main circle with gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full 
                                              shadow-lg border-4 border-white transform-gpu z-10">
                                    {/* Emoji container */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>💰</span>
                                    </div>
                                </div>
                            </div>

                            {/* Welcome Text */}
                            <div className="text-center mt-8">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                                    Join RoomiePay
                                </h2>
                                <p className="text-slate-600 mt-2">Split expenses, not friendships</p>
                                <div className="flex justify-center gap-2 mt-3">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"
                                            style={{ animationDelay: `${i * 0.2}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Input */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                <input
                                    id="name"
                                    type="text"
                                    name="Name"
                                    value={formData.Name}
                                    onChange={handleChange}
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                    placeholder="Full Name"
                                    required
                                />
                                <label
                                    htmlFor="name"
                                    className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                             peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                             peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                             peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                >
                                    Full Name
                                </label>
                            </div>

                            {/* Email Input */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                <input
                                    id="email"
                                    type="email"
                                    name="Email"
                                    value={formData.Email}
                                    onChange={handleChange}
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                    placeholder="Email Address"
                                    required
                                />
                                <label
                                    htmlFor="email"
                                    className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                             peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                             peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                             peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                >
                                    Email Address
                                </label>
                            </div>

                            {/* Password Input */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                <input
                                    id="password"
                                    type="password"
                                    name="Password"
                                    value={formData.Password}
                                    onChange={handleChange}
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                    placeholder="Password"
                                    required
                                />
                                <label
                                    htmlFor="password"
                                    className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                             peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                             peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                             peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                >
                                    Password
                                </label>
                            </div>

                            {/* Phone Input */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                <input
                                    id="phone"
                                    type="tel"
                                    name="Phone"
                                    value={formData.Phone}
                                    onChange={handleChange}
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                    placeholder="Phone Number"
                                />
                                <label
                                    htmlFor="phone"
                                    className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                             peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                             peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                             peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                >
                                    Phone Number
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full overflow-hidden group"
                            >
                                <div className="absolute inset-0 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-[400ms] ease-out group-hover:w-full" />
                                <div className="relative px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                                    <span className="flex items-center justify-center gap-2 text-white font-semibold">
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <>
                                                Create Account
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 py-1 text-slate-500 bg-white rounded-full border border-slate-200">
                                        or
                                    </span>
                                </div>
                            </div>

                            {/* Back to Login Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full bg-white/80 backdrop-blur-sm text-slate-700 font-semibold py-3 px-4 rounded-lg 
                                         border border-slate-200 hover:border-teal-500 hover:text-teal-600 hover:shadow-lg 
                                         transition-all duration-300 group"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Back to Login
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center text-xs text-slate-600">
                            <p>
                                By registering, you agree to our{' '}
                                <a href="#" className="text-teal-600 hover:text-teal-500 transition-colors underline">Terms</a>
                                {' '}and{' '}
                                <a href="#" className="text-teal-600 hover:text-teal-500 transition-colors underline">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes floatUp {
                    0% {
                        transform: translateY(0) rotate(0);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(-${window.innerHeight + 100}px) rotate(360deg);
                        opacity: 0;
                    }
                }

                .particles-container {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
};

export default Register;