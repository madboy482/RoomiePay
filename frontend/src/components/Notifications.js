import React, { useState, useEffect, useRef } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';
import { getNotifications, markNotificationRead, confirmSettlement } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [notificationSuccess, setNotificationSuccess] = useState(false);
    const notificationRef = useRef(null);
    const bellIconRef = useRef(null);

    useEffect(() => {
        loadNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Add click event listener to document for handling outside clicks
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && 
                !notificationRef.current.contains(event.target) &&
                bellIconRef.current && 
                !bellIconRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }

        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationRef, bellIconRef]);

    const loadNotifications = async () => {
        try {
            const response = await getNotifications();
            
            // Sort notifications with unread first, then by date
            const sortedNotifications = response.data.sort((a, b) => {
                if (a.IsRead !== b.IsRead) return a.IsRead ? 1 : -1;
                return new Date(b.CreatedAt) - new Date(a.CreatedAt);
            });
            
            setNotifications(sortedNotifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const toggleNotifications = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowNotifications(prev => !prev);
    };

    const handleNotificationClick = async (notification) => {
        if (notification.Type === 'SETTLEMENT_DUE') {
            setSelectedNotification(notification);
            setShowPaymentDialog(true);
            setShowNotifications(false);
        } else {
            await markNotificationAsRead(notification);
        }
    };

    const markNotificationAsRead = async (notification) => {
        try {
            await markNotificationRead(notification.NotificationID);
            loadNotifications();
            
            // Show success indicator briefly
            setNotificationSuccess(true);
            setTimeout(() => setNotificationSuccess(false), 2000);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handlePayment = async () => {
        if (!paymentMethod.trim()) return;
        
        setPaymentProcessing(true);
        try {
            await confirmSettlement(selectedNotification.SettlementID, paymentMethod);
            await markNotificationAsRead(selectedNotification);
            
            // Success animation before closing
            setTimeout(() => {
                setShowPaymentDialog(false);
                setPaymentMethod('');
                setPaymentProcessing(false);
                loadNotifications();
            }, 1000);
        } catch (error) {
            console.error('Failed to confirm payment:', error);
            setPaymentProcessing(false);
            // We could add error state handling here
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'SETTLEMENT_DUE':
                return <PaymentIcon className="text-red-500" />;
            case 'INFO':
                return <InfoIcon className="text-teal-500" />;
            case 'WARNING':
                return <WarningIcon className="text-amber-500" />;
            default:
                return <InfoIcon className="text-teal-500" />;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / 36e5;
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const unreadCount = notifications.filter(n => !n.IsRead).length;

    // Animation variants for the bell icon
    const bellAnimation = {
        initial: { rotate: 0 },
        ring: { 
            rotate: [0, 15, -15, 10, -10, 5, -5, 0],
            transition: { 
                duration: 0.6,
                ease: "easeInOut",
                times: [0, 0.1, 0.3, 0.4, 0.5, 0.6, 0.8, 1] 
            }
        }
    };

    // Animation variants for notification panel
    const panelAnimation = {
        hidden: { 
            opacity: 0,
            y: -20,
            scale: 0.95
        },
        visible: { 
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { 
                type: "spring",
                damping: 25,
                stiffness: 500
            }
        },
        exit: { 
            opacity: 0,
            y: -20,
            scale: 0.95,
            transition: { 
                duration: 0.2 
            }
        }
    };

    // Animation for notification items
    const itemAnimation = {
        hidden: { opacity: 0, y: 20 },
        visible: (custom) => ({
            opacity: 1,
            y: 0,
            transition: { 
                delay: custom * 0.05,
                duration: 0.3
            }
        })
    };

    return (
        <div className="relative" style={{ zIndex: 9999 }}>
            {/* Notification Bell Icon */}
            <motion.div 
                ref={bellIconRef}
                onClick={toggleNotifications}
                className="p-3 cursor-pointer rounded-full hover:bg-gradient-to-r hover:from-teal-50 hover:to-emerald-50 transition-all duration-300 relative"
                animate={unreadCount > 0 ? "ring" : "initial"}
                variants={bellAnimation}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{ zIndex: 9999 }}
            >
                <div className="text-teal-600 flex items-center justify-center">
                    <NotificationsIcon style={{ fontSize: 24 }} />
                    
                    {/* Unread notification badge with animation */}
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span 
                                className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-md"
                                initial={{ scale: 0 }}
                                animate={{ 
                                    scale: [0, 1.2, 1],
                                    transition: { duration: 0.3 }
                                }}
                                exit={{ scale: 0 }}
                            >
                                {unreadCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Ripple effect for bell icon */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span 
                            className="absolute inset-0 rounded-full bg-teal-200"
                            initial={{ opacity: 0.3, scale: 1 }}
                            animate={{ 
                                opacity: 0,
                                scale: 1.5,
                                transition: { 
                                    repeat: Infinity,
                                    duration: 2,
                                    repeatType: "loop"
                                }
                            }}
                            exit={{ opacity: 0 }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
            
            {/* Notification Panel */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div 
                        ref={notificationRef}
                        className="absolute right-0 mt-2 w-80 sm:w-96 max-h-80 sm:max-h-96 bg-white rounded-xl shadow-xl overflow-hidden z-[9999] border border-teal-100"
                        variants={panelAnimation}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Notification Header */}
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="text-white font-semibold text-lg">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {notificationSuccess && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <CheckCircleIcon className="text-white" fontSize="small" />
                                    </motion.div>
                                )}
                                <button 
                                    onClick={() => setShowNotifications(false)}
                                    className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                                >
                                    <CloseIcon fontSize="small" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Notification List */}
                        <div className="overflow-y-auto bg-gradient-to-b from-white to-teal-50/30" style={{ maxHeight: 'calc(80vh - 56px)' }}>
                            {notifications.length === 0 ? (
                                <motion.div 
                                    className="flex flex-col items-center justify-center py-12 px-4 text-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                                        <NotificationsIcon className="text-teal-300" style={{ fontSize: 30 }} />
                                    </div>
                                    <p className="text-slate-600 font-medium">No notifications yet</p>
                                    <p className="text-slate-500 text-sm mt-1">We'll notify you when something important happens</p>
                                </motion.div>
                            ) : (
                                <motion.div initial="hidden" animate="visible">
                                    {notifications.map((notification, index) => (
                                        <motion.div 
                                            key={notification.NotificationID}
                                            custom={index}
                                            variants={itemAnimation}
                                            whileHover={{ backgroundColor: notification.IsRead ? "rgba(240, 253, 250, 0.6)" : "rgba(255, 255, 255, 0.9)" }}
                                            className={`border-b border-teal-100 last:border-b-0 transition-all duration-200 ${notification.IsRead ? 'bg-teal-50/20' : 'bg-white shadow-sm'}`}
                                        >
                                            <div 
                                                className="px-4 py-3 cursor-pointer"
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1">
                                                        {getNotificationIcon(notification.Type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm ${notification.IsRead ? 'text-slate-700' : 'text-slate-900 font-medium'}`}>
                                                            {notification.Message}
                                                        </p>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xs text-slate-500">
                                                                {formatDate(notification.CreatedAt)}
                                                            </span>
                                                            {notification.Type === 'SETTLEMENT_DUE' && (
                                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                                                    Payment Required
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!notification.IsRead && (
                                                        <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Dialog */}
            <AnimatePresence>
                {showPaymentDialog && (
                    <motion.div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !paymentProcessing && setShowPaymentDialog(false)}
                    >
                        <motion.div 
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 500 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Payment Dialog Header */}
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <PaymentIcon />
                                    Confirm Payment
                                </h2>
                            </div>
                            
                            <div className="p-6">
                                {paymentProcessing ? (
                                    <div className="py-8 flex flex-col items-center">
                                        <motion.div 
                                            className="w-16 h-16 mb-6 border-4 border-teal-200 border-t-teal-600 rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ 
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                        />
                                        <p className="text-teal-700 font-medium text-center">
                                            Processing your payment...
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-teal-50 rounded-lg p-4 mb-6 border-l-4 border-teal-500">
                                            <p className="text-teal-700">
                                                {selectedNotification?.Message}
                                            </p>
                                        </div>
                                        
                                        <div className="mb-6">
                                            <label className="block text-slate-700 text-sm font-medium mb-2" htmlFor="paymentMethod">
                                                Payment Method
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <PaymentIcon className="text-slate-400" fontSize="small" />
                                                </div>
                                                <input
                                                    id="paymentMethod"
                                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                                    type="text"
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    placeholder="e.g., UPI, Bank Transfer, Cash"
                                                    required
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500">
                                                Please specify how you made the payment
                                            </p>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-3">
                                            <motion.button 
                                                className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                                                onClick={() => setShowPaymentDialog(false)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Cancel
                                            </motion.button>
                                            
                                            <motion.button 
                                                className={`px-6 py-2 text-white rounded-lg shadow-md font-medium
                                                    ${paymentMethod.trim() 
                                                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600' 
                                                        : 'bg-slate-300 cursor-not-allowed'}`}
                                                onClick={handlePayment}
                                                disabled={!paymentMethod.trim()}
                                                whileHover={paymentMethod.trim() ? { scale: 1.05 } : {}}
                                                whileTap={paymentMethod.trim() ? { scale: 0.95 } : {}}
                                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                            >
                                                Confirm Payment
                                            </motion.button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Notifications;