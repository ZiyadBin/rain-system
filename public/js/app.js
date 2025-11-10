// app.js - Main application controller
const app = {
    currentUser: null,
    currentFilter: 'MY', // Default filter for queues
    API_BASE: window.location.origin,
    updateTimeInterval: null,

    init() {
        console.log('🌧️ Rain System initialized');
        this.setupEventListeners();
        this.startClock();
        // Check login status
        auth.checkLogin();
    },

    startClock() {
        this.updateTimeInterval = setInterval(() => {
            if (this.currentUser) {
                auth.updateUserDisplay();
            }
        }, 1000);
    },

    // === NEW FUNCTION ===
    // This will fetch the count of duplicates and update the badge
    async updateDuplicatesCount() {
        if (!this.currentUser) return; // Don't run if logged out

        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/duplicates`);
            const duplicates = await response.json();
            const badge = document.getElementById('duplicates-count-badge');
            
            if (badge) {
                if (duplicates.length > 0) {
                    badge.textContent = duplicates.length;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error fetching duplicates count:', error);
        }
    },
    // === END NEW FUNCTION ===

    showPage(pageId, ev) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        
        const pageEl = document.getElementById(pageId);
        if (pageEl) pageEl.classList.add('active');

        // Make the clicked button active
        if (ev && ev.target) {
            ev.target.classList.add('active');
        } else {
            // Fallback for page loads not from a click
            const activeBtn = document.querySelector(`.nav-button[onclick*="'${pageId}'"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }
        
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
            // === NEW CASE ===
            case 'duplicates':
                duplicates.load();
                break;
            // === END NEW CASE ===
            case 'history':
                history.load();
                break;
            case 'reports':
                reports.load();
                break;
        }
        
        // After any page load, refresh the duplicates count
        this.updateDuplicatesCount();
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
