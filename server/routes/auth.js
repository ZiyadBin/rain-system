const express = require('express');
const router = express.Router();

// Mock user database (same as frontend)
const USERS = {
    'ziyad': { password: 'ziyad123', name: 'Ziyad', role: 'admin' },
    'najad': { password: 'najad123', name: 'Najad', role: 'staff' },
    'babu': { password: 'babu123', name: 'Babu', role: 'staff' }
};

// Login endpoint
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username and password required' 
            });
        }

        const user = USERS[username];
        
        if (user && user.password === password) {
            // Return user info (without password)
            const { password: _, ...userInfo } = user;
            res.json({
                success: true,
                user: { username, ...userInfo },
                message: 'Login successful'
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Login failed: ' + error.message
        });
    }
});

// Logout endpoint (for future session management)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Verify token/session (for future use)
router.get('/verify', (req, res) => {
    res.json({
        success: true,
        user: { username: 'ziyad', name: 'Ziyad', role: 'admin' }
    });
});

module.exports = router;
