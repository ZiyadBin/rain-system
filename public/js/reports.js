// reports.js - Updated reports module
const reports = {
    load() {
        this.renderReports();
        this.loadReportData();
    },

    renderReports() {
        const reportsDiv = document.getElementById('reports');
        reportsDiv.innerHTML = `
            <div class="section">
                <h2>📊 Reports & Analytics</h2>
                <div class="reports-controls">
                    <button class="refresh-btn" onclick="reports.loadReportData()">🔄 Refresh Reports</button>
                    <div class="report-period">
                        <strong>Period:</strong>
                        <select id="report-period" onchange="reports.loadReportData()">
                            <option value="TODAY">Today</option>
                            <option value="WEEK" selected>This Week</option>
                            <option value="MONTH">This Month</option>
                            <option value="YEAR">This Year</option>
                        </select>
                    </div>
                </div>
                
                <div class="reports-grid">
                    <div class="report-card">
                        <h3>📈 Performance Overview</h3>
                        <div id="performance-chart">
                            <p>Loading performance data...</p>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <h3>👥 Staff Performance</h3>
                        <div id="staff-performance">
                            <p>Loading staff data...</p>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <h3>🎫 Ticket Statistics</h3>
                        <div id="ticket-stats">
                            <p>Loading ticket statistics...</p>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <h3>💰 Revenue Analysis</h3>
                        <div id="revenue-analysis">
                            <p>Loading revenue data...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadReportData() {
        try {
            const period = document.getElementById('report-period').value;
            const response = await fetch(`${app.API_BASE}/api/reports/analytics?period=${period}`);
            const data = await response.json();
            
            this.displayReports(data);
            
        } catch (error) {
            console.error('Error loading reports:', error);
            // Show sample data for demo
            this.displaySampleReports();
        }
    },

    displayReports(data) {
        if (data.success) {
            this.displayPerformanceChart(data.data);
            this.displayStaffPerformance(data.data.userPerformance);
            this.displayTicketStats(data.data.summary);
            this.displayRevenueAnalysis(data.data);
        } else {
            this.displaySampleReports();
        }
    },

    displaySampleReports() {
        // Sample performance chart
        document.getElementById('performance-chart').innerHTML = `
            <div class="chart-placeholder">
                <div class="chart-bar" style="height: 80%">Mon</div>
                <div class="chart-bar" style="height: 60%">Tue</div>
                <div class="chart-bar" style="height: 90%">Wed</div>
                <div class="chart-bar" style="height: 70%">Thu</div>
                <div class="chart-bar" style="height: 85%">Fri</div>
                <div class="chart-bar" style="height: 95%">Sat</div>
                <div class="chart-bar" style="height: 75%">Sun</div>
            </div>
        `;

        // Sample staff performance
        document.getElementById('staff-performance').innerHTML = `
            <div class="staff-performance-list">
                <div class="staff-item">
                    <span class="staff-name">Ziyad</span>
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: 85%"></div>
                    </div>
                    <span class="performance-value">85%</span>
                </div>
                <div class="staff-item">
                    <span class="staff-name">Najad</span>
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: 72%"></div>
                    </div>
                    <span class="performance-value">72%</span>
                </div>
                <div class="staff-item">
                    <span class="staff-name">Babu</span>
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: 68%"></div>
                    </div>
                    <span class="performance-value">68%</span>
                </div>
            </div>
        `;

        // Sample ticket stats
        document.getElementById('ticket-stats').innerHTML = `
            <div class="stats-grid">
                <div class="mini-stat">
                    <div class="mini-value">24</div>
                    <div class="mini-label">Total Tickets</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-value">18</div>
                    <div class="mini-label">Booked</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-value">6</div>
                    <div class="mini-label">Pending</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-value">75%</div>
                    <div class="mini-label">Success Rate</div>
                </div>
            </div>
        `;

        // Sample revenue analysis
        document.getElementById('revenue-analysis').innerHTML = `
            <div class="revenue-breakdown">
                <div class="revenue-item">
                    <span>Total Revenue:</span>
                    <span class="revenue-amount">₹12,450</span>
                </div>
                <div class="revenue-item">
                    <span>Pending Collection:</span>
                    <span class="revenue-amount pending">₹2,300</span>
                </div>
                <div class="revenue-item">
                    <span>Average per Ticket:</span>
                    <span class="revenue-amount">₹519</span>
                </div>
                <div class="revenue-item">
                    <span>This Month Target:</span>
                    <span class="revenue-amount">₹15,000</span>
                </div>
            </div>
        `;
    },

    displayPerformanceChart(data) {
        // Implementation for real chart data
        document.getElementById('performance-chart').innerHTML = `
            <div class="chart-placeholder">
                Performance chart would be displayed here with real data
            </div>
        `;
    },

    displayStaffPerformance(staffData) {
        let html = '<div class="staff-performance-list">';
        
        if (staffData && Object.keys(staffData).length > 0) {
            Object.keys(staffData).forEach(staff => {
                const performance = staffData[staff];
                const completionRate = performance.total > 0 ? 
                    Math.round((performance.booked / performance.total) * 100) : 0;
                
                html += `
                    <div class="staff-item">
                        <span class="staff-name">${staff}</span>
                        <div class="performance-bar">
                            <div class="performance-fill" style="width: ${completionRate}%"></div>
                        </div>
                        <span class="performance-value">${completionRate}%</span>
                    </div>
                `;
            });
        } else {
            html += '<p>No staff performance data available</p>';
        }
        
        html += '</div>';
        document.getElementById('staff-performance').innerHTML = html;
    },

    displayTicketStats(summary) {
        if (summary) {
            document.getElementById('ticket-stats').innerHTML = `
                <div class="stats-grid">
                    <div class="mini-stat">
                        <div class="mini-value">${summary.total}</div>
                        <div class="mini-label">Total Tickets</div>
                    </div>
                    <div class="mini-stat">
                        <div class="mini-value">${summary.booked}</div>
                        <div class="mini-label">Booked</div>
                    </div>
                    <div class="mini-stat">
                        <div class="mini-value">${summary.pending}</div>
                        <div class="mini-label">Pending</div>
                    </div>
                    <div class="mini-stat">
                        <div class="mini-value">${summary.completionRate}%</div>
                        <div class="mini-label">Success Rate</div>
                    </div>
                </div>
            `;
        }
    },

    displayRevenueAnalysis(data) {
        // This would display real revenue data when available
        document.getElementById('revenue-analysis').innerHTML = `
            <div class="revenue-breakdown">
                <div class="revenue-item">
                    <span>Revenue data would be displayed here when integrated with payment system</span>
                </div>
            </div>
        `;
    }
};
