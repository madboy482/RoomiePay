import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroups, createGroup, joinGroup } from '../services/api';

const Dashboard = () => {
    const [groups, setGroups] = useState([]);
    const [openCreate, setOpenCreate] = useState(false);
    const [openJoin, setOpenJoin] = useState(false);
    const [groupForm, setGroupForm] = useState({ GroupName: '', Description: '' });
    const [inviteCode, setInviteCode] = useState('');
    const [newGroupInviteCode, setNewGroupInviteCode] = useState('');
    const [showInviteCode, setShowInviteCode] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const response = await getGroups();
            setGroups(response.data);
        } catch (error) {
            console.error('Failed to load groups:', error);
            setError('Failed to load groups');
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await createGroup(groupForm);
            setNewGroupInviteCode(response.data.InviteCode);
            setShowInviteCode(true);
            loadGroups();
        } catch (error) {
            setError('Failed to create group');
        }
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await joinGroup(inviteCode);
            console.log('Join group response:', response);
            setOpenJoin(false);
            setInviteCode('');
            if (response.data && response.data.GroupID) {
                navigate(`/group/${response.data.GroupID}`);
            } else {
                loadGroups();
            }
        } catch (error) {
            console.error('Join group error:', error);
            setError(error.response?.data?.detail || 'Failed to join group. Please check the invite code.');
        }
    };

    const handleGroupClick = (groupId) => {
        navigate(`/group/${groupId}`);
    };

    // Random color generator for group avatars
    const getGroupColor = (groupName) => {
        const colors = [
            'from-teal-400 to-emerald-500',
            'from-emerald-400 to-green-500',
            'from-cyan-400 to-teal-500',
            'from-green-400 to-teal-500',
            'from-lime-400 to-emerald-500',
            'from-teal-400 to-cyan-500',
        ];
        
        // Hash the group name to get a consistent color
        const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    // Get initials from group name for avatar
    const getGroupInitials = (groupName) => {
        return groupName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    const getRandomMemberCount = () => {
        return Math.floor(Math.random() * 10) + 2; // Random number between 2-12
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                            My Groups
                        </h1>
                        <p className="text-slate-600 max-w-xl">
                            Create or join groups to collaborate with others on projects, share resources, and stay connected.
                        </p>
                    </div>
                    
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <button 
                            className="relative px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300 group"
                            onClick={() => setOpenCreate(true)}
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Group
                            </span>
                            <span className="absolute inset-0 rounded-lg overflow-hidden">
                                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                            </span>
                        </button>
                        
                        <button 
                            className="px-6 py-3 bg-white text-teal-600 font-medium rounded-lg border border-teal-200 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-100 transition-all duration-300 group"
                            onClick={() => setOpenJoin(true)}
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Join Group
                            </span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6 relative" role="alert">
                        <div className="flex items-start">
                            <div className="py-1">
                                <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
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

                {/* Group Cards */}
                {groups.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-teal-100 p-10 text-center">
                        <div className="flex justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 mb-2">No Groups Yet</h2>
                        <p className="text-slate-500 mb-6">Create a new group or join an existing one to get started</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button 
                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                                onClick={() => setOpenCreate(true)}
                            >
                                Create First Group
                            </button>
                            <button 
                                className="px-6 py-3 bg-white text-teal-600 font-medium rounded-lg border border-teal-200 hover:border-teal-400 transition-all duration-300"
                                onClick={() => setOpenJoin(true)}
                            >
                                Join a Group
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => {
                            const memberCount = getRandomMemberCount(); // In real app, get from API
                            const lastActive = new Date(); // In real app, get from API
                            lastActive.setDate(lastActive.getDate() - Math.floor(Math.random() * 10));
                            
                            return (
                                <div 
                                    key={group.GroupID}
                                    onClick={() => handleGroupClick(group.GroupID)}
                                    className="group relative bg-white rounded-xl shadow-md hover:shadow-xl border border-teal-50 overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                                >
                                    {/* Top gradient banner */}
                                    <div className={`h-24 bg-gradient-to-r ${getGroupColor(group.GroupName)}`}>
                                        <div className="absolute right-4 top-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-medium text-white">
                                            {memberCount} members
                                        </div>
                                    </div>
                                    
                                    {/* Group Avatar */}
                                    <div className="relative -mt-10 ml-6 mb-4">
                                        <div className={`w-20 h-20 rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br ${getGroupColor(group.GroupName)}`}>
                                            {getGroupInitials(group.GroupName)}
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="px-6 pb-6">
                                        <h2 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">
                                            {group.GroupName}
                                        </h2>
                                        
                                        <p className="text-slate-600 mb-4 line-clamp-2 min-h-[3rem]">
                                            {group.Description || "No description provided."}
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div className="text-sm text-slate-500 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Last active: {formatDate(lastActive)}
                                            </div>
                                            
                                            <div className="relative overflow-hidden rounded-md">
                                                <div className="px-3 py-1 text-sm font-medium text-teal-600 bg-teal-50 group-hover:bg-teal-100 transition-colors duration-300">
                                                    View Group
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create Group Dialog */}
                {openCreate && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            {!showInviteCode ? (
                                <>
                                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4">
                                        <h2 className="text-2xl font-bold text-white">
                                            Create New Group
                                        </h2>
                                    </div>
                                    <form onSubmit={handleCreateGroup} className="p-6">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <label htmlFor="groupName" className="block text-sm font-medium text-slate-700">
                                                    Group Name
                                                </label>
                                                <input
                                                    id="groupName"
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                                    type="text"
                                                    value={groupForm.GroupName}
                                                    onChange={(e) => setGroupForm({ ...groupForm, GroupName: e.target.value })}
                                                    placeholder="Enter a name for your group"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                                                    Description
                                                </label>
                                                <textarea
                                                    id="description"
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                                    rows="3"
                                                    value={groupForm.Description}
                                                    onChange={(e) => setGroupForm({ ...groupForm, Description: e.target.value })}
                                                    placeholder="What is this group about?"
                                                />
                                            </div>

                                            <div className="space-y-4 pt-4">
                                                <button 
                                                    type="submit" 
                                                    className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                                >
                                                    Create Group
                                                </button>
                                                
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenCreate(false);
                                                        setError('');
                                                    }}
                                                    className="w-full px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-all duration-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div>
                                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-4">
                                        <h2 className="text-2xl font-bold text-white">
                                            Success!
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-center mb-6">
                                            <div className="bg-green-100 rounded-full p-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-xl font-semibold text-slate-800 text-center mb-2">
                                            Group Created Successfully!
                                        </h3>
                                        
                                        <p className="text-slate-600 mb-6 text-center">
                                            Share this invite code with others to join your group:
                                        </p>
                                        
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={newGroupInviteCode}
                                                    className="flex-grow bg-white p-3 rounded-l-lg border border-slate-300 font-mono text-slate-800"
                                                />
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(newGroupInviteCode);
                                                        // Show a tooltip or notification
                                                    }}
                                                    className="bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-r-lg transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                            onClick={() => {
                                                setOpenCreate(false);
                                                setShowInviteCode(false);
                                            }}
                                        >
                                            Go to Dashboard
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Join Group Dialog */}
                {openJoin && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4">
                                <h2 className="text-2xl font-bold text-white">
                                    Join a Group
                                </h2>
                            </div>
                            
                            <div className="p-6">
                                {error && (
                                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6" role="alert">
                                        <p className="font-bold">Error</p>
                                        <p>{error}</p>
                                    </div>
                                )}
                                
                                <form onSubmit={handleJoinGroup} className="space-y-6">
                                    <div className="space-y-1">
                                        <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-700">
                                            Invite Code
                                        </label>
                                        <input
                                            id="inviteCode"
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value)}
                                            placeholder="Enter the invite code"
                                            required
                                        />
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <button 
                                            type="submit" 
                                            className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                                        >
                                            Join Group
                                        </button>
                                        
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setOpenJoin(false);
                                                setInviteCode('');
                                                setError('');
                                            }}
                                            className="w-full px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;