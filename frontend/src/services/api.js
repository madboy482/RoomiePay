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
    console.log('API Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
    });
    return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear invalid token
            localStorage.removeItem('token');
            // Redirect to login page
            window.location.href = '/login';
        }
        console.error('API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        });
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

export const addExpense = (expenseData) => {
    // Log the headers being sent
    const token = localStorage.getItem('token');
    console.log('Token being sent:', token);
    
    console.log('Adding expense with data:', expenseData);
    return api.post('/expenses', expenseData);
};

export const getGroupExpenses = (groupId, period = null) => {
    let url = `/groups/${groupId}/expenses`;
    if (period) {
        url += `?period=${period}`;
    }
    return api.get(url);
};

export const getSettlementSummary = (groupId, period = null) => {
    let url = `/groups/${groupId}/settlements/summary`;
    if (period) {
        url += `?period=${period}`;
    }
    return api.get(url);
};

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

export const finalizeGroupSplits = async (groupId, forceCreate = true) => {
  try {
    const response = await axios.post(
      `${API_URL}/groups/${groupId}/finalize-splits`, 
      { force_create: forceCreate, include_all: true },
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    return response; // Return the full response object, not just response.data
  } catch (error) {
    console.error("Error finalizing group splits:", error);
    throw error;
  }
};

// Settlement endpoints
export const getSettlementHistory = () => 
    api.get('/settlements/history');

export const processPayment = (settlementId, amount) => 
    api.post(`/settlements/${settlementId}/process-payment`, { amount });

export const getGroupSettlements = async (groupId) => {
  try {
    const response = await axios.get(`${API_URL}/groups/${groupId}/settlements`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching group settlements:", error);
    throw error;
  }
};

export const getGroupInviteCode = (groupId) =>
    api.get(`/groups/${groupId}/invite-code`);