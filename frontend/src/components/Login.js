import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [shake, setShake] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const createParticle = () => {
            const particle = document.createElement('div');
            const size = Math.random() * 15 + 5;
            const startPosition = Math.random() * window.innerWidth;
            const startTop = window.innerHeight + size; // Start from bottom
            
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

    const showError = (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out z-50 animate-slideIn';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.classList.add('opacity-0');
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await login(email, password);
            const { access_token, user } = response.data;
            
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify({
                UserID: user.UserID,
                Name: user.Name,
                Email: user.Email
            }));
            
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setLoginAttempts(prev => prev + 1);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            showError('Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
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
            <div className="relative flex justify-center items-center min-h-screen px-4 z-10">
                <div className={`w-full max-w-md transform transition-all duration-300 hover:scale-[1.01] ${shake ? 'animate-shake' : ''}`}>
                    <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-white/20">
                        {/* Card Header with Logo */}
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
            Welcome Back
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

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                    placeholder="Email"
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
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3 text-slate-400 hover:text-teal-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Remember Me and Forgot Password */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="remember-me"
                                            checked={rememberMe}
                                            onChange={() => setRememberMe(!rememberMe)}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                                        />
                                        <label
                                            htmlFor="remember-me"
                                            className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out
                                                ${rememberMe ? 'bg-teal-500' : 'bg-gray-300'}`}
                                        />
                                    </div>
                                    <span className="text-sm text-slate-600">Remember me</span>
                                </div>
                                <a href="#" className="text-sm text-teal-600 hover:text-teal-500 transition-colors">
                                    Forgot password?
                                </a>
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
                                                Sign In
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
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Social Login Buttons */}
                            <div className="grid grid-cols-3 gap-4">
                                {['Google', 'GitHub', 'Apple'].map((provider) => (
                                    <button
                                        key={provider}
                                        type="button"
                                        className="relative group bg-white p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <img
                                            src={`https://${provider.toLowerCase()}.com/favicon.ico`}
                                            alt={provider}
                                            className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Create Account Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="w-full bg-white/80 backdrop-blur-sm text-slate-700 font-semibold py-3 px-4 rounded-lg 
                                         border border-slate-200 hover:border-teal-500 hover:text-teal-600 hover:shadow-lg 
                                         transition-all duration-300 group"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Create New Account
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center text-xs text-slate-600">
                            <p>
                                By continuing, you agree to our{' '}
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

export default Login;