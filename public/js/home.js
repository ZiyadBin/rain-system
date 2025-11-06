// home.js - Home dashboard for unpaid tickets
const home = {
    unpaidTickets: [],
    currentFilter: 'MY', // FIXED: Track current filter

    load() {
        this.renderHome();
        this.loadUnpaidTickets();
    },

    renderHome() {
        const homeDiv = document.getElementById('home');
        homeDiv.innerHTML = `
            <div class="section">
                <h2>🏠 Home Dashboard</h2>
                <div class="dashboard-controls">
                    <button class="refresh-btn" onclick="home.loadUnpaidTickets()">🔄 Refresh</button>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <strong>View:</strong>
                        <button class="filter-btn ${this.currentFilter === 'MY' ? 'active' : ''}" onclick="home.filterUnpaid('MY')">My Unpaid</button>
                        <button class="filter-btn ${this.currentFilter === 'ALL' ? 'active' : ''}" onclick="home.filterUnpaid('ALL')">All Unpaid</button>
                    </div>
                    <span id="unpaid-count" style="font-weight: bold; color: #dc3545;">Loading...</span>
                </div>
                
                <div id="unpaid-tickets-content">
                    <p>Loading unpaid tickets...</p>
                </div>
            </div>
        `;
    },

    async loadUnpaidTickets() {
        try {
            this.unpaidTickets = await this.fetchUnpaidFromSheets();
            this.displayUnpaidTickets();
            
        } catch (error) {
            app.showMessage('❌ Error loading unpaid tickets: ' + error.message, 'error');
        }
    },

    async fetchUnpaidFromSheets() {
        // Simulate API call to Google Sheets
        const allUnpaid = [
            {
                pnr: '1234567890',
                from: 'CSTM',
                to: 'KYN',
                name: 'John Doe',
                mobile: '9876543210',
                staff: 'Ziyad',
                doj: '2024-01-25',
                dob: '2024-01-20',
                mrp: 500,
                paid: 0,
                balance: 500
            },
            {
                pnr: '0987654321',
                from: 'PNVL',
                to: 'NK',
                name: 'Jane Smith',
                mobile: '9876543211',
                staff: 'Najad',
                doj: '2024-01-26',
                dob: '2024-01-21',
                mrp: 750,
                paid: 300,
                balance: 450
            },
            {
                pnr: '1122334455',
                from: 'CSTM',
                to: 'LTT',
                name: 'Mike Johnson',
                mobile: '9876543212',
                staff: 'Babu',
                doj: '2024-01-27',
                dob: '2024-01-22',
                mrp: 600,
                paid: 0,
                balance: 600
            }
        ];

        // FIXED: Filter by current user if 'MY' filter is selected
        if (this.currentFilter === 'MY' && app.currentUser) {
            return allUnpaid.filter(ticket => ticket.staff === app.currentUser.name);
        }
        
        return allUnpaid;
    },

    displayUnpaidTickets() {
        const content = document.getElementById('unpaid-tickets-content');
        const count = document.getElementById('unpaid-count');
        
        // FIXED: Apply current filter
        let filteredTickets = this.unpaidTickets;
        if (this.currentFilter === 'MY' && app.currentUser) {
            filteredTickets = this.unpaidTickets.filter(ticket => ticket.staff === app.currentUser.name);
        }

        if (!filteredTickets || filteredTickets.length === 0) {
            content.innerHTML = '<div class="no-unpaid">🎉 No unpaid tickets found!</div>';
            count.textContent = '0 unpaid tickets';
            return;
        }

        // Group by staff
        const staffGroups = {};
        filteredTickets.forEach(ticket => {
            if (!staffGroups[ticket.staff]) staffGroups[ticket.staff] = [];
            staffGroups[ticket.staff].push(ticket);
        });

        let html = '';
        
        Object.keys(staffGroups).forEach(staff => {
            const staffTickets = staffGroups[staff];
            const totalBalance = staffTickets.reduce((sum, ticket) => sum + (ticket.balance || 0), 0);
            
            html += `
                <div class="staff-unpaid-section">
                    <div class="staff-header">
                        <h3>${staff}</h3>
                        <span class="total-balance">Total Due: ₹${totalBalance}</span>
                    </div>
                    <div class="unpaid-tickets-grid">
            `;
            
            staffTickets.forEach(ticket => {
                html += `
                    <div class="unpaid-ticket-card">
                        <div class="unpaid-header">
                            <strong>${ticket.from} → ${ticket.to}</strong>
                            <span class="balance-amount">₹${ticket.balance}</span>
                        </div>
                        <div class="unpaid-details">
                            <div><strong>${ticket.name}</strong></div>
                            <div>📱 ${ticket.mobile}</div>
                            <div>🎫 PNR: ${ticket.pnr}</div>
                            <div>📅 Journey: ${new Date(ticket.doj).toLocaleDateString()}</div>
                            <div class="amount-breakdown">
                                <span>MRP: ₹${ticket.mrp}</span>
                                <span>Paid: ₹${ticket.paid}</span>
                                <span class="due-amount">Due: ₹${ticket.balance}</span>
                            </div>
                        </div>
                        <div class="unpaid-actions">
                            <button class="action-btn-small" onclick="home.contactCustomer('${ticket.mobile}')">📞 Call</button>
                            <button class="action-btn-small" onclick="home.remindCustomer('${ticket.pnr}')">💬 Remind</button>
                            <button class="action-btn-small" onclick="home.markPaid('${ticket.pnr}')">✅ Paid</button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        content.innerHTML = html;
        count.textContent = `${filteredTickets.length} unpaid tickets`;
    },

    filterUnpaid(filter) {
        this.currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Reload with new filter
        this.loadUnpaidTickets();
    },

    contactCustomer(mobile) {
        window.open(`tel:${mobile}`, '_self');
    },

    remindCustomer(pnr) {
        // This would send a reminder via SMS/WhatsApp
        app.showMessage(`📱 Reminder sent for PNR: ${pnr}`, 'success');
    },

    markPaid(pnr) {
        if (confirm('Mark this ticket as fully paid?')) {
            // This would update Google Sheets
            app.showMessage(`✅ Ticket ${pnr} marked as paid!`, 'success');
            this.loadUnpaidTickets();
        }
    }
};
