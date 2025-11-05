const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../public'));

// Routes
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));

// Root route
app.get('/', (req, res) => {
    res.json({ message: '🌧️ Rain System API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 API: http://localhost:${PORT}/api`);
});
