// app.js - Main application controller
const app = {
    currentUser: null,
    currentFilter: 'MY', // FIXED: Default to 'MY' for user's tickets only
    API_BASE: window.location.origin,
    updateTimeInterval: null,

    init() {
        console.log('🌧️ Rain System initialized');
        this.injectCSS();
        this.setupEventListeners();
        this.startClock();
    },

    startClock() {
        // Update time every second
        this.updateTimeInterval = setInterval(() => {
            if (this.currentUser) {
                auth.updateUserDisplay();
            }
        }, 1000);
    },

    injectCSS() {
        // Your existing CSS injection code remains the same
        const style = document.createElement('style');
        style.textContent = `/* Your CSS here */`;
        document.head.appendChild(style);
    },

    // NOTE: Accept optional event parameter and safely determine the clicked nav button.
    showPage(pageId, ev) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        
        // Show target page
        const pageEl = document.getElementById(pageId);
        if (pageEl) pageEl.classList.add('active');

        // Safely mark the nav button active.
        // If the click event is passed, use its target. Otherwise, find the button whose onclick refers to the pageId.
        let activeBtn = null;
        if (ev && ev.target) {
            activeBtn = ev.target;
        } else {
            // Fallback: find inline nav-button whose onclick contains the pageId string
            activeBtn = document.querySelector(`.nav-button[onclick*="${pageId}"]`);
        }
        if (activeBtn) activeBtn.classList.add('active');
        
        // Load page-specific content
        switch(pageId) {
            case 'home':
                home.load();
                break;
            case 'quick-entry':
                quickEntry.load();
                break;
            case 'ac-queue':
                queue.load('AC');
                break;
            case 'non-ac-queue':
                queue.load('NON_AC');
                break;
            case 'history':
                history.load();
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
