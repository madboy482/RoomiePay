import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);
            const { access_token, user } = response.data;
            
            // Store complete user data
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
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white shadow-lg rounded-lg p-8 w-80">
                <h2 className="text-xl font-semibold text-center mb-4">
                    RoomiePay Login
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 mt-4"
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className="w-full text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-md transition duration-200 mt-2"
                        onClick={() => navigate('/register')}
                    >
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;