// auth.js - JSON-based authentication
const auth = {
    users: [],

    async loadUsers() {
        try {
            const response = await fetch('data/users.json');
            this.users = await response.json();
        } catch (error) {
            console.error('Error loading users:', error);
            // Fallback to default users
            this.users = [
                { username: 'ziyad', password: 'ziyad123', name: 'Ziyad', role: 'admin' },
                { username: 'najad', password: 'najad123', name: 'Najad', role: 'staff' },
                { username: 'babu', password: 'babu123', name: 'Babu', role: 'staff' }
            ];
        }
    },

    async handleLogin() {
        await this.loadUsers();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            app.currentUser = {
                username: user.username,
                name: user.name,
                role: user.role
            };
            
            this.showApp();
            app.showMessage('🎉 Login successful!', 'success');
        } else {
            app.showMessage('❌ Invalid username or password', 'error');
        }
    },

    showApp() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        this.updateUserDisplay();
    },

    updateUserDisplay() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('en-IN');
        
        document.getElementById('user-display').innerHTML = `
            ${app.currentUser.name} (${app.currentUser.role})<br>
            <small>${dateString} ${timeString}</small>
        `;
    },

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            app.currentUser = null;
            document.getElementById('app-section').style.display = 'none';
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
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
