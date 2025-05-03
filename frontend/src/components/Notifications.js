import React, { useState, useEffect } from 'react';
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
            <button 
                className="text-white p-2 rounded-full focus:outline-none relative"
                onClick={handleClick}
            >
                <NotificationsIcon />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>
            
            {anchorEl && (
                <div className="fixed inset-0 z-50" onClick={handleClose}>
                    <div 
                        className="absolute bg-white rounded-md shadow-lg overflow-hidden max-h-80 w-80"
                        style={{
                            top: anchorEl.getBoundingClientRect().bottom + window.scrollY,
                            left: anchorEl.getBoundingClientRect().left + window.scrollX - 280, // Position to the left of icon
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="overflow-y-auto max-h-80">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-3">
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <React.Fragment key={notification.NotificationID}>
                                        <div 
                                            className={`px-4 py-3 hover:bg-gray-100 cursor-pointer ${notification.IsRead ? 'bg-gray-50' : 'bg-white'}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <p className="text-sm font-medium text-gray-900">{notification.Message}</p>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                <span>{new Date(notification.CreatedAt).toLocaleString()}</span>
                                                {notification.Type === 'SETTLEMENT_DUE' && (
                                                    <span className="ml-2 text-red-500 font-medium">• Payment Required</span>
                                                )}
                                            </div>
                                        </div>
                                        <hr className="border-gray-200" />
                                    </React.Fragment>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPaymentDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Confirm Payment</h2>
                        <p className="mb-4 text-gray-700">
                            {selectedNotification?.Message}
                        </p>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="paymentMethod">
                                Payment Method
                            </label>
                            <input
                                id="paymentMethod"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="text"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                placeholder="e.g., UPI, Bank Transfer, Cash"
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                                onClick={() => setShowPaymentDialog(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={`px-4 py-2 text-white rounded ${paymentMethod ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                                onClick={handlePayment}
                                disabled={!paymentMethod}
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Notifications;