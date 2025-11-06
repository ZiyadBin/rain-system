// history.js - Booked tickets history from Google Sheets
const history = {
    bookedTickets: [],

    load() {
        this.renderHistory();
        this.loadBookedHistory();
    },

    renderHistory() {
        const historyDiv = document.getElementById('history');
        historyDiv.innerHTML = `
            <div class="section">
                <h2>📋 Booking History</h2>
                <div class="history-controls">
                    <button class="refresh-btn" onclick="history.loadBookedHistory()">🔄 Refresh Data</button>
                    <div class="date-filters">
                        <strong>Period:</strong>
                        <button class="filter-btn active" onclick="history.filterByPeriod('TODAY')">Today</button>
                        <button class="filter-btn" onclick="history.filterByPeriod('WEEK')">This Week</button>
                        <button class="filter-btn" onclick="history.filterByPeriod('MONTH')">This Month</button>
                        <button class="filter-btn" onclick="history.filterByPeriod('ALL')">All Time</button>
                    </div>
                    <span id="history-count" style="font-weight: bold; color: #555;">Loading...</span>
                </div>
                
                <div class="history-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-bookings">0</div>
                        <div class="stat-label">Total Bookings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="total-revenue">₹0</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="pending-amount">₹0</div>
                        <div class="stat-label">Pending Amount</div>
                    </div>
                </div>
                
                <div id="history-content">
                    <p>Loading booking history...</p>
                </div>
            </div>
        `;
    },

    async loadBookedHistory() {
        try {
            this.bookedTickets = await this.fetchHistoryFromSheets();
            this.displayHistory();
            this.updateStats();
            
        } catch (error) {
            app.showMessage('❌ Error loading history: ' + error.message, 'error');
        }
    },

    async fetchHistoryFromSheets() {
        // Simulate API call to Google Sheets
        return [
            {
                dob: '2024-01-20',
                doj: '2024-01-25',
                pnr: '1234567890',
                from: 'CSTM',
                to: 'KYN',
                name: 'John Doe',
                mobile: '9876543210',
                staff: 'Ziyad',
                mrp: 500,
                paid: 500,
                balance: 0,
                status: 'Paid'
            },
            {
                dob: '2024-01-21',
                doj: '2024-01-26',
                pnr: '0987654321',
                from: 'PNVL',
                to: 'NK',
                name: 'Jane Smith',
                mobile: '9876543211',
                staff: 'Najad',
                mrp: 750,
                paid: 300,
                balance: 450,
                status: 'Partial'
            }
        ];
    },

    displayHistory() {
        const content = document.getElementById('history-content');
        const count = document.getElementById('history-count');
        
        if (!this.bookedTickets || this.bookedTickets.length === 0) {
            content.innerHTML = '<div class="no-history">No booking history found</div>';
            count.textContent = '0 bookings';
            return;
        }

        let html = `
            <div class="history-table-container">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>DOB</th>
                            <th>DOJ</th>
                            <th>PNR</th>
                            <th>Route</th>
                            <th>Passenger</th>
                            <th>Staff</th>
                            <th>MRP</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.bookedTickets.forEach(ticket => {
            const statusClass = ticket.balance === 0 ? 'paid' : ticket.paid > 0 ? 'partial' : 'unpaid';
            
            html += `
                <tr>
                    <td>${new Date(ticket.dob).toLocaleDateString()}</td>
                    <td>${new Date(ticket.doj).toLocaleDateString()}</td>
                    <td>${ticket.pnr}</td>
                    <td>${ticket.from} → ${ticket.to}</td>
                    <td>${ticket.name}</td>
                    <td>${ticket.staff}</td>
                    <td>₹${ticket.mrp}</td>
                    <td>₹${ticket.paid}</td>
                    <td class="balance-cell ${statusClass}">₹${ticket.balance}</td>
                    <td><span class="status-badge ${statusClass}">${ticket.status}</span></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        content.innerHTML = html;
        count.textContent = `${this.bookedTickets.length} bookings`;
    },

    updateStats() {
        const totalBookings = this.bookedTickets.length;
        const totalRevenue = this.bookedTickets.reduce((sum, ticket) => sum + (ticket.paid || 0), 0);
        const pendingAmount = this.bookedTickets.reduce((sum, ticket) => sum + (ticket.balance || 0), 0);

        document.getElementById('total-bookings').textContent = totalBookings;
        document.getElementById('total-revenue').textContent = `₹${totalRevenue}`;
        document.getElementById('pending-amount').textContent = `₹${pendingAmount}`;
    },

    filterByPeriod(period) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Filter logic would be implemented here
        this.loadBookedHistory();
    }
};
