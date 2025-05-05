import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

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
            
            console.log('Logged in as:', user.Name, '(ID:', user.UserID, ')');
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
            <div className="relative w-96 transform hover:scale-[1.02] transition-all duration-300">
                {/* Decorative Elements */}
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

                {/* Main Card */}
                <div className="relative bg-white/90 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-8 border border-white/20">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            Welcome to RoomiePay
                        </h2>
                        <p className="text-slate-600 mt-2 text-sm">Split expenses, not friendships</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-slate-700 text-sm font-medium pl-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-slate-700 text-sm font-medium pl-1" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Sign In'}
                            </span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-full bg-white text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform border border-slate-200 hover:border-teal-500 hover:text-teal-600 hover:shadow-md"
                            onClick={() => navigate('/register')}
                        >
                            Create New Account
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        Forgot your password?{' '}
                        <a href="#" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                            Reset it here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;