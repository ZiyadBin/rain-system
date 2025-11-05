// app.js - Main application controller
const app = {
    currentUser: null,
    currentFilter: 'MY',
    API_BASE: window.location.origin,

    init() {
        console.log('🌧️ Rain System initialized');
        this.setupEventListeners();
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
