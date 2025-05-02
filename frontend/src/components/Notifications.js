import React, { useState, useEffect } from 'react';
import {
    Badge,
    IconButton,
    Menu,
    MenuItem,
    ListItemText,
    Typography,
    Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getNotifications, markNotificationRead } from '../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await getNotifications();
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        try {
            await markNotificationRead(notification.NotificationID);
            loadNotifications(); // Reload to update the unread count
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.IsRead).length;

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: 300,
                        width: 320,
                    },
                }}
            >
                {notifications.length === 0 ? (
                    <MenuItem>
                        <ListItemText primary="No notifications" />
                    </MenuItem>
                ) : (
                    notifications.map((notification) => (
                        <React.Fragment key={notification.NotificationID}>
                            <MenuItem onClick={() => handleNotificationClick(notification)}>
                                <ListItemText
                                    primary={notification.Message}
                                    secondary={
                                        <Typography variant="caption" color="textSecondary">
                                            {new Date(notification.CreatedAt).toLocaleString()}
                                        </Typography>
                                    }
                                    style={{
                                        color: notification.IsRead ? 'text.secondary' : 'inherit'
                                    }}
                                />
                            </MenuItem>
                            <Divider />
                        </React.Fragment>
                    ))
                )}
            </Menu>
        </>
    );
};

export default Notifications;