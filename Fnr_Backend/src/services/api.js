import axios from 'axios';

// API URL
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Booking services
export const bookingService = {
  getBookings: () => api.get('/bookings'),
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  updateBooking: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  deleteBooking: (id) => api.delete(`/bookings/${id}`),

};

// Member services
export const memberService = {
  getProfile: () => api.get('/members/profile'),
  updateProfile: (id, profileData) => api.put(`/members/${id}`, profileData),
  createProfile: (profileData) => api.post('/members', profileData),
};

// Inventory services
export const inventoryService = {
  getInventory: () => api.get('/inventory'),
  addItem: (itemData) => api.post('/inventory', itemData),
  updateItem: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  deleteItem: (id) => api.delete(`/inventory/${id}`),
};

// Reports services
export const reportService = {
  getBookingStats: () => api.get('/reports/bookings'),
  getMembershipStats: () => api.get('/reports/members'),
  getInventoryStats: () => api.get('/reports/inventory'),
};


// give me sum of 2 number in java

