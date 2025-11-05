// app.js - Main application controller
const app = {
    currentUser: null,
    currentFilter: 'MY',
    API_BASE: window.location.origin,

    init() {
        console.log('🌧️ Rain System initialized');
        this.injectCSS();
        this.setupEventListeners();
    },

    injectCSS() {
        // Inject the CSS styles from your original code
        const style = document.createElement('style');
        style.textContent = `
            /* Add all the CSS from your original file here */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); line-height: 1.6; min-height: 100vh; padding: 20px; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            /* ... include all your CSS styles from the original file ... */
        `;
        document.head.appendChild(style);
    },

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(pageId).classList.add('active');
        event.target.classList.add('active');
        
        // Load page-specific content
        switch(pageId) {
            case 'quick-entry':
                quickEntry.load();
                break;
            case 'queue':
                queue.load();
                break;
            case 'reports':
                reports.load();
                break;
        }
    },

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('passenger-mobile')) {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
            }
        });
    },

    showMessage(text, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => app.init());
