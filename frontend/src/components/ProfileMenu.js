import React, { useState, useEffect } from 'react';
import { 
    Person as PersonIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ProfileMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState(null);
    const [isMenuClosing, setIsMenuClosing] = useState(false);
    const navigate = useNavigate();
    const open = Boolean(anchorEl);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        setIsMenuClosing(false);
    };

    const handleClose = () => {
        setIsMenuClosing(true);
        setTimeout(() => {
            setAnchorEl(null);
            setIsMenuClosing(false);
        }, 200);
    };

    const handleLogout = () => {
        handleClose();
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }, 200);
    };

    if (!user) return null;

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    };

    return (
        <>
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">
                    {user.Name}
                </span>
                <button
                    onClick={handleClick}
                    className="relative group"
                    aria-controls={open ? 'profile-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    {/* Avatar Container with Gradient Border */}
                    <div className="relative">
                        {/* Gradient border animation */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full opacity-70 group-hover:opacity-100 blur transition-opacity duration-300" />
                        
                        {/* White background */}
                        <div className="absolute inset-0 bg-white rounded-full" />
                        
                        {/* Avatar content */}
                        <div className="relative w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                            <span className="text-white text-sm font-semibold">
                                {getInitials(user.Name)}
                            </span>
                        </div>
                    </div>
                </button>
            </div>

            {open && (
                <div 
                    className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <div 
                        className={`absolute bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden w-72 transition-all duration-300 ${isMenuClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                        style={{
                            top: anchorEl.getBoundingClientRect().bottom + window.scrollY + 8,
                            right: window.innerWidth - anchorEl.getBoundingClientRect().right - 16,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Profile Section */}
                        <div className="p-4 bg-gradient-to-r from-teal-500/10 to-emerald-500/10">
                            <div className="flex items-center gap-3">
                                {/* Profile Avatar */}
                                <div className="relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full opacity-70 blur" />
                                    <div className="relative w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                            {getInitials(user.Name)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Profile Info */}
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{user.Name}</p>
                                    <p className="text-xs text-slate-500">{user.Email}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-2 space-y-1">
                            {/* Menu Items */}
                            <button 
                                className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-gradient-to-r from-teal-50 to-emerald-50 transition-colors duration-300 group"
                            >
                                <div className="text-slate-500 group-hover:text-teal-600 transition-colors duration-300">
                                    <SettingsIcon fontSize="small" />
                                </div>
                                <span className="text-sm text-slate-700 group-hover:text-teal-700 font-medium">Settings</span>
                            </button>
                            
                            <button 
                                className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-red-50 transition-colors duration-300 group"
                                onClick={handleLogout}
                            >
                                <div className="text-slate-500 group-hover:text-red-600 transition-colors duration-300">
                                    <LogoutIcon fontSize="small" />
                                </div>
                                <span className="text-sm text-slate-700 group-hover:text-red-600 font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileMenu;