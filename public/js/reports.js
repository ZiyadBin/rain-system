// reports.js - Reports module
const reports = {
    load() {
        this.renderReports();
        this.loadReportData();
    },

    renderReports() {
        const reportsDiv = document.getElementById('reports');
        reportsDiv.innerHTML = `
            <div class="section">
                <h2>Reports & Analytics</h2>
                <div class="queue-controls">
                    <button class="refresh-btn" onclick="reports.loadReportData()">🔄 Refresh Reports</button>
                </div>
                <div id="reports-content">
                    <p>Loading reports...</p>
                </div>
            </div>
        `;
    },

    async loadReportData() {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets?filter=ALL`);
            const tickets = await response.json();
            
            this.displayReports(tickets);
            
        } catch (error) {
            app.showMessage('❌ Error loading reports: ' + error.message, 'error');
        }
    },

    displayReports(tickets) {
        if (!tickets || tickets.length === 0) {
            document.getElementById('reports-content').innerHTML = '<p>No tickets found for reporting.</p>';
            return;
        }

        // Basic analytics
        const totalTickets = tickets.length;
        const bookedTickets = tickets.filter(t => t.status === 'booked').length;
        const pendingTickets = tickets.filter(t => t.status !== 'booked').length;
        
        // Group by user
        const userStats = {};
        tickets.forEach(ticket => {
            const user = ticket.created_by;
            if (!userStats[user]) userStats[user] = { total: 0, booked: 0 };
            userStats[user].total++;
            if (ticket.status === 'booked') userStats[user].booked++;
        });

        let html = `
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="stat-card" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3>Total Tickets</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${totalTickets}</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3>Booked</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${bookedTickets}</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3>Pending</h3>
                    <div style="font-size: 2rem; font-weight: bold;">${pendingTickets}</div>
                </div>
            </div>

            <div class="user-stats" style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #e0e0e0;">
                <h3>User Performance</h3>
                <div style="display: grid; gap: 15px; margin-top: 15px;">
        `;

        Object.keys(userStats).forEach(user => {
            const stats = userStats[user];
            const completionRate = ((stats.booked / stats.total) * 100).toFixed(1);
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <span style="font-weight: bold;">${user}</span>
                    <span>Total: ${stats.total} | Booked: ${stats.booked} | Rate: ${completionRate}%</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        document.getElementById('reports-content').innerHTML = html;
    }
};
