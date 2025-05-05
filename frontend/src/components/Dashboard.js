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

    // Keep all your existing useEffect and handler functions the same
    // Only UI/styling changes below

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-8">
                    My Groups
                </h1>
                
                <div className="mb-8 flex gap-4">
                    <button 
                        className="relative px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 group"
                        onClick={() => setOpenCreate(true)}
                    >
                        <span className="flex items-center gap-2">
                            Create Group
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </span>
                    </button>
                    <button 
                        className="px-6 py-3 bg-white/80 backdrop-blur-sm text-teal-600 font-medium rounded-lg border border-teal-200 hover:border-teal-500 hover:shadow-lg transition-all duration-300 group"
                        onClick={() => setOpenJoin(true)}
                    >
                        <span className="flex items-center gap-2">
                            Join Group
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </span>
                    </button>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div 
                            key={group.GroupID}
                            onClick={() => handleGroupClick(group.GroupID)}
                            className="group relative bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl border border-white/20 p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">{group.GroupName}</h2>
                            <p className="text-slate-600">{group.Description}</p>
                        </div>
                    ))}
                </div>

                {/* Create Group Dialog */}
                {openCreate && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                            {!showInviteCode ? (
                                <>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                                        Create New Group
                                    </h2>
                                    <form onSubmit={handleCreateGroup} className="space-y-6">
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                            <input
                                                id="groupName"
                                                className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                                type="text"
                                                value={groupForm.GroupName}
                                                onChange={(e) => setGroupForm({ ...groupForm, GroupName: e.target.value })}
                                                placeholder="Group Name"
                                                required
                                            />
                                            <label
                                                htmlFor="groupName"
                                                className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                                         peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                                         peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                                         peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                            >
                                                Group Name
                                            </label>
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                            <textarea
                                                id="description"
                                                className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                                rows="3"
                                                value={groupForm.Description}
                                                onChange={(e) => setGroupForm({ ...groupForm, Description: e.target.value })}
                                                placeholder="Description"
                                            />
                                            <label
                                                htmlFor="description"
                                                className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                                         peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                                         peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                                         peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                            >
                                                Description
                                            </label>
                                        </div>

                                        <button 
                                            type="submit" 
                                            className="relative w-full overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-[400ms] ease-out group-hover:w-full" />
                                            <div className="relative px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                                                <span className="flex items-center justify-center gap-2 text-white font-semibold">
                                                    Create Group
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </button>
                                    </form>
                                    <button 
                                        onClick={() => {
                                            setOpenCreate(false);
                                            setError('');
                                        }}
                                        className="mt-4 text-slate-600 hover:text-teal-600 transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                                        Group Created Successfully!
                                    </h2>
                                    <p className="text-slate-600 mb-4">
                                        Share this invite code with others:
                                    </p>
                                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-lg border border-teal-100 mb-6">
                                        <p className="text-center text-lg font-mono text-teal-800 select-all">
                                            {newGroupInviteCode}
                                        </p>
                                    </div>
                                    <button 
                                        className="relative w-full overflow-hidden group"
                                        onClick={() => {
                                            setOpenCreate(false);
                                            setShowInviteCode(false);
                                        }}
                                    >
                                        <div className="absolute inset-0 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-[400ms] ease-out group-hover:w-full" />
                                        <div className="relative px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                                            <span className="flex items-center justify-center gap-2 text-white font-semibold">
                                                Close
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Join Group Dialog */}
                {openJoin && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-6">
                                Join Group
                            </h2>
                            
                            {error && (
                                <div className="bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}
                            
                            <form onSubmit={handleJoinGroup} className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                                    <input
                                        id="inviteCode"
                                        className="peer w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white/50 hover:bg-white placeholder-transparent"
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        placeholder="Invite Code"
                                        required
                                    />
                                    <label
                                        htmlFor="inviteCode"
                                        className="absolute left-2 -top-2.5 bg-white px-2 text-sm text-slate-600 transition-all duration-200 
                                                 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 
                                                 peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 
                                                 peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-sm peer-focus:text-teal-600"
                                    >
                                        Invite Code
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    className="relative w-full overflow-hidden group"
                                >
                                    <div className="absolute inset-0 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-[400ms] ease-out group-hover:w-full" />
                                    <div className="relative px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                                        <span className="flex items-center justify-center gap-2 text-white font-semibold">
                                            Join Group
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </div>
                                </button>
                            </form>
                            
                            <button 
                                onClick={() => {
                                    setOpenJoin(false);
                                    setInviteCode('');
                                    setError('');
                                }}
                                className="mt-4 text-slate-600 hover:text-teal-600 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;