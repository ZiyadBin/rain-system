// auth.js - Server-side authentication
const auth = {
    users: [], // Cache for the user list

    // === NEW FUNCTION ===
    // Fetches user list from server and caches it
    async loadUsers() {
        if (this.users.length > 0) {
            return this.users; // Return from cache if available
        }
        
        try {
            const response = await fetch(`${app.API_BASE}/api/auth/users`);
            const result = await response.json();
            if (result.success) {
                this.users = result.users; // Cache the list
                return this.users;
            } else {
                return []; // Return empty on error
            }
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    },
    // === END NEW FUNCTION ===

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            app.showMessage('❌ Please enter username and password', 'error');
            return;
        }

        try {
            const response = await fetch(`${app.API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                // Set the current user from the server's response
                app.currentUser = result.user;
                
                this.showApp();
                app.showMessage('🎉 Login successful!', 'success');

                // Pre-load the user list for the "Assign" modal
                this.loadUsers();
            } else {
                app.showMessage(`❌ ${result.error || 'Invalid username or password'}`, 'error');
            }

        } catch (error) {
            console.error('Login error:', error);
            app.showMessage('❌ Network error during login. Please try again.', 'error');
        }
    },

    showApp() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        this.updateUserDisplay();
        
        // === CHANGED === (Hide Reports button for staff)
        const reportsButton = document.getElementById('nav-button-reports');
        if (app.currentUser.role === 'staff') {
            reportsButton.style.display = 'none';
        } else {
            reportsButton.style.display = 'inline-block';
        }
        // === END CHANGE ===
        
        // Load the default home page after login
        app.showPage('home'); 
    },

    updateUserDisplay() {
        if (!app.currentUser) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('en-IN');
        
        // === CHANGED === (Removed role)
        document.getElementById('user-display').innerHTML = `
            ${app.currentUser.name}<br>
            <small>${dateString} ${timeString}</small>
        `;
    },

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            app.currentUser = null;
            this.users = []; // Clear user cache on logout
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
