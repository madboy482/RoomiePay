import React, { useState, useEffect } from 'react';
import {
    Badge,
    IconButton,
    Menu,
    MenuItem,
    ListItemText,
    Typography,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getNotifications, markNotificationRead, confirmSettlement } from '../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');

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
        if (notification.Type === 'SETTLEMENT_DUE') {
            setSelectedNotification(notification);
            setShowPaymentDialog(true);
        } else {
            await markNotificationAsRead(notification);
        }
    };

    const markNotificationAsRead = async (notification) => {
        try {
            await markNotificationRead(notification.NotificationID);
            loadNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handlePayment = async () => {
        try {
            await confirmSettlement(selectedNotification.SettlementID, paymentMethod);
            await markNotificationAsRead(selectedNotification);
            setShowPaymentDialog(false);
            setPaymentMethod('');
            loadNotifications();
        } catch (error) {
            console.error('Failed to confirm payment:', error);
            alert('Failed to confirm payment');
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
                            <MenuItem 
                                onClick={() => handleNotificationClick(notification)}
                                style={{
                                    backgroundColor: notification.IsRead ? '#f5f5f5' : 'white'
                                }}
                            >
                                <ListItemText
                                    primary={notification.Message}
                                    secondary={
                                        <Typography variant="caption" color="textSecondary">
                                            {new Date(notification.CreatedAt).toLocaleString()}
                                            {notification.Type === 'SETTLEMENT_DUE' && (
                                                <Typography
                                                    component="span"
                                                    color="error"
                                                    style={{ marginLeft: 8 }}
                                                >
                                                    • Payment Required
                                                </Typography>
                                            )}
                                        </Typography>
                                    }
                                />
                            </MenuItem>
                            <Divider />
                        </React.Fragment>
                    ))
                )}
            </Menu>

            <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
                <DialogTitle>Confirm Payment</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        {selectedNotification?.Message}
                    </Typography>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Payment Method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="e.g., UPI, Bank Transfer, Cash"
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handlePayment}
                        variant="contained"
                        disabled={!paymentMethod}
                    >
                        Confirm Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Notifications;