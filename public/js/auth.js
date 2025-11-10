// auth.js - Server-side authentication
const auth = {
    
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
