import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Grid, Dialog, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getGroups, createGroup, joinGroup } from '../services/api';

const Dashboard = () => {
    const [groups, setGroups] = useState([]);
    const [openCreate, setOpenCreate] = useState(false);
    const [openJoin, setOpenJoin] = useState(false);
    const [groupForm, setGroupForm] = useState({ GroupName: '', Description: '' });
    const [inviteCode, setInviteCode] = useState('');
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
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await createGroup(groupForm);
            setOpenCreate(false);
            loadGroups();
        } catch (error) {
            alert('Failed to create group');
        }
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        try {
            await joinGroup(inviteCode);
            setOpenJoin(false);
            loadGroups();
        } catch (error) {
            alert('Failed to join group');
        }
    };

    const handleGroupClick = (groupId) => {
        navigate(`/group/${groupId}`);
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                My Groups
            </Typography>
            
            <Box mb={3}>
                <Button variant="contained" onClick={() => setOpenCreate(true)} sx={{ mr: 1 }}>
                    Create Group
                </Button>
                <Button variant="outlined" onClick={() => setOpenJoin(true)}>
                    Join Group
                </Button>
            </Box>

            <Grid container spacing={2}>
                {groups.map((group) => (
                    <Grid item xs={12} sm={6} md={4} key={group.GroupID}>
                        <Paper
                            elevation={3}
                            sx={{ p: 2, cursor: 'pointer' }}
                            onClick={() => handleGroupClick(group.GroupID)}
                        >
                            <Typography variant="h6">{group.GroupName}</Typography>
                            <Typography variant="body2" color="textSecondary">
                                {group.Description}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Create Group Dialog */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
                <Box p={3} width={300}>
                    <Typography variant="h6" gutterBottom>Create New Group</Typography>
                    <form onSubmit={handleCreateGroup}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Group Name"
                            value={groupForm.GroupName}
                            onChange={(e) => setGroupForm({ ...groupForm, GroupName: e.target.value })}
                            required
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Description"
                            value={groupForm.Description}
                            onChange={(e) => setGroupForm({ ...groupForm, Description: e.target.value })}
                            multiline
                            rows={3}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
                            Create
                        </Button>
                    </form>
                </Box>
            </Dialog>

            {/* Join Group Dialog */}
            <Dialog open={openJoin} onClose={() => setOpenJoin(false)}>
                <Box p={3} width={300}>
                    <Typography variant="h6" gutterBottom>Join Group</Typography>
                    <form onSubmit={handleJoinGroup}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Invite Code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            required
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
                            Join
                        </Button>
                    </form>
                </Box>
            </Dialog>
        </Box>
    );
};

export default Dashboard;