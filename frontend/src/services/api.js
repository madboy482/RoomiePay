import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear invalid token
            localStorage.removeItem('token');
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const login = (email, password) => 
    api.post('/token', { Email: email, Password: password });

export const register = (userData) => 
    api.post('/register', userData);

export const createGroup = (groupData) => 
    api.post('/groups', groupData);

export const joinGroup = (inviteCode) => 
    api.post(`/groups/join/${inviteCode}`);

export const getGroups = () => 
    api.get('/groups');

export const addExpense = (expenseData) => 
    api.post('/expenses/split', expenseData);

export const getGroupExpenses = (groupId, period = null) => {
    let url = `/groups/${groupId}/expenses`;
    if (period) {
        url += `?period=${period}`;
    }
    return api.get(url);
};

export const getSettlementSummary = (url) =>
    api.get(url);

export const getGroupBalances = (groupId) => 
    api.get(`/groups/${groupId}/balances`);

export const createSettlement = (settlementData) => 
    api.post('/settlements', settlementData);

export const confirmSettlement = (settlementId, paymentMethod) => 
    api.put(`/settlements/${settlementId}/confirm`, { paymentMethod });

export const setSettlementPeriod = (groupId, period) =>
    api.post(`/groups/${groupId}/settlement-period`, { period });

export const getNotifications = () =>
    api.get('/notifications');

export const markNotificationRead = (notificationId) =>
    api.put(`/notifications/${notificationId}/read`);

export const getUnpaidSettlements = (userId) =>
    api.get(`/users/${userId}/pending_settlements`);

export const finalizeGroupSplits = (groupId) =>
    api.post(`/groups/${groupId}/finalize-splits`);