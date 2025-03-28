const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./src/middleware/errorHandler');
const requestLogger = require('./src/middleware/requestLogger');
const userRoutes = require('./src/routes/user');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(requestLogger);
app.use(express.urlencoded({ extended: false }));
app.use('/api/users', userRoutes);

// Public Routes (No Auth Required)
app.use('/api/auth', require('./src/routes/auth'));

// Protected Routes (Auth Required)
app.use('/api/logs', require('./src/routes/logRoutes'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/inventory', require('./src/routes/inventory'));
app.use('/api/members', require('./src/routes/members'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/manager', require('./src/routes/manager'));
app.use('/api/member-dashboard', require('./src/routes/memberDashboard'));
app.use('/api/memberships', require('./src/routes/memberships'));

// Error handler
app.use(errorHandler);

module.exports = app;