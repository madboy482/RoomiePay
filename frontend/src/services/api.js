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

export const getGroupExpenses = (groupId) => 
    api.get(`/groups/${groupId}/expenses`);

export const getSettlementSummary = (url) =>
    api.get(url);

export const getGroupBalances = (groupId) => 
    api.get(`/groups/${groupId}/balances`);

export const createSettlement = (settlementData) => 
    api.post('/settlements', settlementData);

export const confirmSettlement = (settlementId) => 
    api.put(`/settlements/${settlementId}/confirm`);

export const setSettlementPeriod = (groupId, period) =>
    api.post(`/groups/${groupId}/settlement-period`, { period });

export const getNotifications = () =>
    api.get('/notifications');

export const markNotificationRead = (notificationId) =>
    api.put(`/notifications/${notificationId}/read`);