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
        // Dynamic particle creation
        const createParticle = () => {
            const particle = document.createElement('div');
            const size = Math.random() * 15 + 5;
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(to right, #0d9488, #059669);
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * 100}vw;
                animation: float 5s linear forwards;
            `;
            document.querySelector('.particles')?.appendChild(particle);
            setTimeout(() => particle.remove(), 5000);
        };

        const interval = setInterval(createParticle, 300);
        return () => clearInterval(interval);
    }, []);

    const showError = (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            animation: slideIn 0.3s ease-out forwards;
            z-index: 50;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
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
        <>
            <style jsx>{`
                @keyframes float {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100vh) rotate(360deg);
                        opacity: 0;
                    }
                }

                @keyframes slideIn {
                    0% { transform: translateX(100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }

                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }

                .particles {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 0;
                }

                .shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }

                .toggle-checkbox:checked {
                    right: 0;
                    transform: translateX(100%);
                    border-color: #0d9488;
                }
            `}</style>

            <div className="relative flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 overflow-hidden">
                <div className="particles absolute inset-0" />
                
                <div className={`relative w-96 transform hover:scale-[1.02] transition-all duration-300 ${shake ? 'shake' : ''}`}>
                    {/* Animated background blobs */}
                    <div className="absolute -top-4 -left-4 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-[blob_7s_infinite]" />
                    <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-[blob_7s_infinite_2s]" />
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-[blob_7s_infinite_4s]" />

                    {/* Main Card */}
                    <div className="relative bg-white/90 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-8 border border-white/20">
                        {/* Logo Section */}
                        <div className="mb-8 text-center transform hover:scale-105 transition-transform duration-300">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                                <span className="text-3xl">💰</span>
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
                                Welcome to RoomiePay
                            </h2>
                            <p className="text-slate-600 mt-2 text-sm">
                                Split expenses, not friendships
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
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
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="peer w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Remember Me Toggle */}
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

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 
                                         hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg 
                                         transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg 
                                         disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                                <span className="flex items-center justify-center gap-2 relative z-10">
                                    {isLoading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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
                                <div className="absolute inset-0 h-full w-full scale-0 rounded-lg transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"/>
                            </button>

                            {/* Social Login Section */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"/>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {['Google', 'GitHub', 'Apple'].map((provider) => (
                                    <button
                                        key={provider}
                                        type="button"
                                        className="flex items-center justify-center p-3 bg-white border border-slate-200 
                                                 rounded-lg hover:shadow-md hover:border-teal-500 transition-all duration-200"
                                    >
                                        <img 
                                            src={`https://${provider.toLowerCase()}.com/favicon.ico`} 
                                            alt={provider} 
                                            className="w-5 h-5"
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Create Account Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="w-full bg-white text-slate-700 font-semibold py-3 px-4 rounded-lg 
                                         transition-all duration-200 transform border border-slate-200 
                                         hover:border-teal-500 hover:text-teal-600 hover:shadow-md group"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Create New Account
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                            </button>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-6 text-center text-sm text-slate-600 space-y-2">
                            <p className="hover:text-teal-600 transition-colors">
                                <a href="#" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                                    Forgot your password?
                                </a>
                            </p>
                            <p className="text-xs">
                                By continuing, you agree to our{' '}
                                <a href="#" className="text-teal-600 hover:text-teal-500 transition-colors">Terms</a>
                                {' '}and{' '}
                                <a href="#" className="text-teal-600 hover:text-teal-500 transition-colors">Privacy Policy</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;