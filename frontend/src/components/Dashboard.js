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
            
            // Close the join dialog
            setOpenJoin(false);
            setInviteCode('');
            
            // Refresh groups list
            await loadGroups();
            
            // Get the group ID from the response and navigate to it
            if (response.data && response.data.GroupID) {
                navigate(`/group/${response.data.GroupID}`);
            } else {
                // If we don't have the group ID, just refresh the dashboard
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
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">
                My Groups
            </h1>
            
            <div className="mb-6">
                <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mr-2"
                    onClick={() => setOpenCreate(true)}
                >
                    Create Group
                </button>
                <button 
                    className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded"
                    onClick={() => setOpenJoin(true)}
                >
                    Join Group
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <span 
                        className="absolute top-0 right-0 px-4 py-3"
                        onClick={() => setError('')}
                    >
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <title>Close</title>
                            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                        </svg>
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <div 
                        key={group.GroupID}
                        className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleGroupClick(group.GroupID)}
                    >
                        <h2 className="text-lg font-semibold">{group.GroupName}</h2>
                        <p className="text-gray-600 text-sm">
                            {group.Description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Create Group Dialog */}
            {openCreate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        {!showInviteCode ? (
                            <>
                                <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
                                <form onSubmit={handleCreateGroup}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="groupName">
                                            Group Name
                                        </label>
                                        <input
                                            id="groupName"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            type="text"
                                            value={groupForm.GroupName}
                                            onChange={(e) => setGroupForm({ ...groupForm, GroupName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="description">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            value={groupForm.Description}
                                            onChange={(e) => setGroupForm({ ...groupForm, Description: e.target.value })}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md mt-4"
                                    >
                                        Create
                                    </button>
                                </form>
                                <button 
                                    onClick={() => {
                                        setOpenCreate(false);
                                        setError('');
                                    }}
                                    className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Group Created!</h2>
                                <p className="mb-2">
                                    Share this invite code with others:
                                </p>
                                <div className="bg-gray-100 p-4 my-4 text-center text-lg font-bold rounded">
                                    {newGroupInviteCode}
                                </div>
                                <button 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                                    onClick={() => {
                                        setOpenCreate(false);
                                        setShowInviteCode(false);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Join Group Dialog */}
            {openJoin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Join Group</h2>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleJoinGroup}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="inviteCode">
                                    Invite Code
                                </label>
                                <input
                                    id="inviteCode"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md mt-4"
                            >
                                Join
                            </button>
                        </form>
                        <button 
                            onClick={() => {
                                setOpenJoin(false);
                                setInviteCode('');
                                setError('');
                            }}
                            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;