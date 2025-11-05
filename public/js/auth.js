// auth.js - Authentication module
const auth = {
    USERS: {
        'ziyad': { password: 'ziyad123', name: 'Ziyad', role: 'admin' },
        'najad': { password: 'najad123', name: 'Najad', role: 'staff' },
        'babu': { password: 'babu123', name: 'Babu', role: 'staff' }
    },

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (this.USERS[username] && this.USERS[username].password === password) {
            app.currentUser = {
                username: username,
                ...this.USERS[username]
            };
            
            this.showApp();
            app.showMessage('🎉 Login successful! Welcome to Rain System', 'success');
        } else {
            app.showMessage('❌ Invalid username or password', 'error');
        }
    },

    showApp() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        document.getElementById('user-display').textContent = 
            `${app.currentUser.name} (${app.currentUser.role})`;
    },

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            app.currentUser = null;
            app.currentFilter = 'MY';
            document.getElementById('app-section').style.display = 'none';
            document.getElementById('login-section').style.display = 'block';
            app.showMessage('👋 Logged out successfully', 'success');
        }
    }
};

// Enter key support for login
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') auth.handleLogin();
    });
});
