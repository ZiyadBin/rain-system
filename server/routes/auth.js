const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Path to the users JSON file
const USERS_PATH = path.join(__dirname, '../../public/data/users.json');

// Helper function to read users
const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users.json:', error);
        // Fallback in case file is missing
        return [
            { username: 'ziyad', password: 'ziyad123', name: 'Ziyad', role: 'admin' },
            { username: 'najad', password: 'najad123', name: 'Najad', role: 'staff' },
            { username: 'babu', password: 'babu123', name: 'Babu', role: 'staff' }
        ];
    }
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

        const users = readUsers();
        const user = users.find(u => u.username === username.trim() && u.password === password);
        
        if (user) {
            // Return user info (without password)
            const { password: _, ...userInfo } = user;
            res.json({
                success: true,
                user: userInfo, // Send user object (name, role, username)
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

// === NEW ENDPOINT ===
// Get all users (for assign modal)
router.get('/users', (req, res) => {
    try {
        const users = readUsers();
        // Send users WITHOUT passwords
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
        res.json({ success: true, users: safeUsers });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to load users: ' + error.message
        });
    }
});
// === END NEW ENDPOINT ===

// Logout endpoint (for future session management)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = router;
