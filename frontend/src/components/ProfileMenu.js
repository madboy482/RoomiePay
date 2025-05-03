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
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    // Get initials from user's name
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <span className="text-sm text-white">
                    {user.Name}
                </span>
                <button
                    onClick={handleClick}
                    className="flex items-center justify-center rounded-full w-8 h-8 focus:outline-none"
                    aria-controls={open ? 'profile-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                        {getInitials(user.Name)}
                    </div>
                </button>
            </div>

            {open && (
                <div className="fixed inset-0 z-50" onClick={handleClose}>
                    <div 
                        className="absolute bg-white rounded-md shadow-lg overflow-hidden w-56"
                        style={{
                            top: anchorEl.getBoundingClientRect().bottom + window.scrollY,
                            right: window.innerWidth - anchorEl.getBoundingClientRect().right - 16,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="py-1">
                            <div className="px-4 py-2 flex items-center">
                                <div className="mr-2 text-gray-500">
                                    <PersonIcon fontSize="small" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Profile</p>
                                    <p className="text-xs text-gray-500">{user.Email}</p>
                                </div>
                            </div>
                            
                            <hr className="my-1 border-gray-200" />
                            
                            <button 
                                className="px-4 py-2 flex items-center w-full text-left hover:bg-gray-100"
                            >
                                <div className="mr-2 text-gray-500">
                                    <SettingsIcon fontSize="small" />
                                </div>
                                <span className="text-sm text-gray-700">Settings</span>
                            </button>
                            
                            <button 
                                className="px-4 py-2 flex items-center w-full text-left hover:bg-gray-100"
                                onClick={handleLogout}
                            >
                                <div className="mr-2 text-gray-500">
                                    <LogoutIcon fontSize="small" />
                                </div>
                                <span className="text-sm text-gray-700">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileMenu;