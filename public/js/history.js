// history.js - Booked tickets history with editing and Excel export
const history = {
    bookedTickets: [],
    currentFilter: 'ALL',
    currentPeriod: 'MONTH',

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
                        <button class="filter-btn ${this.currentPeriod === 'TODAY' ? 'active' : ''}" onclick="history.filterByPeriod('TODAY')">Today</button>
                        <button class="filter-btn ${this.currentPeriod === 'WEEK' ? 'active' : ''}" onclick="history.filterByPeriod('WEEK')">This Week</button>
                        <button class="filter-btn ${this.currentPeriod === 'MONTH' ? 'active' : ''}" onclick="history.filterByPeriod('MONTH')">This Month</button>
                        <button class="filter-btn ${this.currentPeriod === 'ALL' ? 'active' : ''}" onclick="history.filterByPeriod('ALL')">All Time</button>
                    </div>
                    
                    <div class="date-filters">
                        <strong>Staff:</strong>
                        <button class="filter-btn ${this.currentFilter === 'ALL' ? 'active' : ''}" onclick="history.filterByStaff('ALL')">All Staff</button>
                        <button class="filter-btn ${this.currentFilter === 'MY' ? 'active' : ''}" onclick="history.filterByStaff('MY')">My Bookings</button>
                    </div>
                    
                    <button class="refresh-btn" onclick="history.exportToExcel()" style="background: #28a745;">📊 Export to Excel</button>
                    
                    <span id="history-count" style="font-weight: bold; color: #555;">Loading...</span>
                </div>
                
                <div class="history-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-bookings">0</div>
                        <div class="stat-label">Total Bookings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="today-bookings">0</div>
                        <div class="stat-label">Today</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="week-bookings">0</div>
                        <div class="stat-label">This Week</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="my-bookings">0</div>
                        <div class="stat-label">My Bookings</div>
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
            const response = await fetch(`${app.API_BASE}/api/booked?period=${this.currentPeriod}&staff=${this.currentFilter}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.bookedTickets = result.data;
                this.displayHistory();
                this.updateStats();
            } else {
                throw new Error(result.error || 'Failed to load history');
            }
            
        } catch (error) {
            console.error('❌ Error loading history:', error);
            app.showMessage('❌ Error loading history: ' + error.message, 'error');
        }
    },

    displayHistory() {
        const content = document.getElementById('history-content');
        const count = document.getElementById('history-count');
        
        if (!this.bookedTickets || this.bookedTickets.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>📭 No booking history found</h3>
                    <p>No booked tickets found for the selected filters.</p>
                    <p>Try changing the period or staff filter.</p>
                </div>
            `;
            count.textContent = '0 bookings';
            return;
        }

        let html = `
            <div class="history-table-container">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Booked Date</th>
                            <th>Journey Date</th>
                            <th>PNR</th>
                            <th>Route</th>
                            <th>Passenger</th>
                            <th>Mobile</th>
                            <th>Staff</th>
                            <th>Class</th>
                            <th>Train</th>
                            <th>Remark</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.bookedTickets.forEach(ticket => {
            const bookedDate = new Date(ticket.booked_date).toLocaleDateString();
            const journeyDate = new Date(ticket.journey_date).toLocaleDateString();
            
            html += `
                <tr data-ticket-id="${ticket.id}">
                    <td>${bookedDate}</td>
                    <td>${journeyDate}</td>
                    <td><strong>${ticket.pnr}</strong></td>
                    <td>${ticket.from} → ${ticket.to}</td>
                    <td>${ticket.name}</td>
                    <td>${ticket.mobile}</td>
                    <td>${ticket.staff}</td>
                    <td><span class="ticket-class">${ticket.class}</span></td>
                    <td>${ticket.train_number || 'N/A'}</td>
                    <td>${ticket.remark || ''}</td>
                    <td>
                        <button class="action-btn-small edit-btn" onclick="history.editBookedTicket('${ticket.id}')">✏️ Edit</button>
                        <button class="action-btn-small delete-btn" onclick="history.deleteBookedTicket('${ticket.id}')">🗑️ Delete</button>
                    </td>
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
        const today = new Date().toLocaleDateString();
        const todayBookings = this.bookedTickets.filter(ticket => 
            new Date(ticket.booked_date).toLocaleDateString() === today
        ).length;
        
        // This week bookings (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekBookings = this.bookedTickets.filter(ticket => 
            new Date(ticket.booked_date) >= weekAgo
        ).length;
        
        // My bookings
        const myBookings = this.bookedTickets.filter(ticket => 
            ticket.staff === app.currentUser.name
        ).length;

        document.getElementById('total-bookings').textContent = totalBookings;
        document.getElementById('today-bookings').textContent = todayBookings;
        document.getElementById('week-bookings').textContent = weekBookings;
        document.getElementById('my-bookings').textContent = myBookings;
    },

    filterByPeriod(period) {
        this.currentPeriod = period;
        document.querySelectorAll('.date-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.loadBookedHistory();
    },

    filterByStaff(filter) {
        this.currentFilter = filter === 'MY' ? app.currentUser.name : 'ALL';
        document.querySelectorAll('.date-filters ~ .date-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        this.loadBookedHistory();
    },

    // Edit booked ticket
    async editBookedTicket(ticketId) {
        try {
            const ticket = this.bookedTickets.find(t => t.id === ticketId);
            if (!ticket) {
                app.showMessage('❌ Ticket not found', 'error');
                return;
            }

            this.renderEditModal(ticket);
            
        } catch (error) {
            app.showMessage('❌ Error loading ticket: ' + error.message, 'error');
        }
    },

    renderEditModal(ticket) {
        const modal = document.getElementById('editModal');
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>✏️ Edit Booked Ticket</h3>
                <form id="editBookedForm">
                    <div class="edit-form-group">
                        <label for="edit-pnr">PNR Number</label>
                        <input type="text" id="edit-pnr" value="${ticket.pnr}" required maxlength="10">
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-from">From Station</label>
                        <input type="text" id="edit-from" value="${ticket.from}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-to">To Station</label>
                        <input type="text" id="edit-to" value="${ticket.to}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-name">Passenger Name</label>
                        <input type="text" id="edit-name" value="${ticket.name}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-mobile">Mobile</label>
                        <input type="tel" id="edit-mobile" value="${ticket.mobile}" required maxlength="10">
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-class">Class</label>
                        <select id="edit-class" required>
                            <option value="1A" ${ticket.class === '1A' ? 'selected' : ''}>1A</option>
                            <option value="2A" ${ticket.class === '2A' ? 'selected' : ''}>2A</option>
                            <option value="3A" ${ticket.class === '3A' ? 'selected' : ''}>3A</option>
                            <option value="CC" ${ticket.class === 'CC' ? 'selected' : ''}>CC</option>
                            <option value="EC" ${ticket.class === 'EC' ? 'selected' : ''}>EC</option>
                            <option value="SL" ${ticket.class === 'SL' ? 'selected' : ''}>SL</option>
                            <option value="2S" ${ticket.class === '2S' ? 'selected' : ''}>2S</option>
                        </select>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-train">Train Number</label>
                        <input type="text" id="edit-train" value="${ticket.train_number || ''}">
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-journey-date">Journey Date</label>
                        <input type="date" id="edit-journey-date" value="${ticket.journey_date}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-remark">Remark</label>
                        <textarea id="edit-remark" rows="3">${ticket.remark || ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="close-btn" onclick="history.closeEditModal()">Cancel</button>
                        <button type="submit" class="save-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('editBookedForm').addEventListener('submit', (e) => this.saveEditedBookedTicket(e, ticket.id));
        modal.style.display = 'flex';
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    },

    async saveEditedBookedTicket(event, ticketId) {
        event.preventDefault();
        
        try {
            const updates = {
                pnr: document.getElementById('edit-pnr').value,
                from: document.getElementById('edit-from').value,
                to: document.getElementById('edit-to').value,
                name: document.getElementById('edit-name').value,
                mobile: document.getElementById('edit-mobile').value,
                class: document.getElementById('edit-class').value,
                train_number: document.getElementById('edit-train').value,
                journey_date: document.getElementById('edit-journey-date').value,
                remark: document.getElementById('edit-remark').value
            };

            const response = await fetch(`${app.API_BASE}/api/booked/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            const result = await response.json();
            if (result.success) {
                app.showMessage('✅ Booked ticket updated successfully!', 'success');
                this.closeEditModal();
                this.loadBookedHistory();
            } else {
                app.showMessage('❌ Error updating booked ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    },

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
    },

    // Delete booked ticket
    async deleteBookedTicket(ticketId) {
        if (!confirm('Are you sure you want to delete this booked ticket? This action cannot be undone.')) {
            return;
        }

        try {
            // Since we don't have a delete endpoint for booked tickets, we'll use a workaround
            // by updating the status or handling it differently
            app.showMessage('⚠️ Delete functionality for booked tickets is not yet implemented', 'error');
            // In a real implementation, you would call a DELETE endpoint
            // const response = await fetch(`${app.API_BASE}/api/booked/${ticketId}`, {
            //     method: 'DELETE'
            // });
            
        } catch (error) {
            app.showMessage('❌ Error deleting booked ticket: ' + error.message, 'error');
        }
    },

    // Export to Excel (CSV)
    async exportToExcel() {
        try {
            console.log('📊 Exporting to Excel...');
            
            // Get current filters
            const params = new URLSearchParams({
                period: this.currentPeriod,
                staff: this.currentFilter === 'MY' ? app.currentUser.name : 'ALL'
            });

            const response = await fetch(`${app.API_BASE}/api/booked/export?${params}`);
            
            if (!response.ok) {
                throw new Error(`Export failed with status: ${response.status}`);
            }

            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `booked_tickets_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            app.showMessage('✅ Excel file downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Export error:', error);
            app.showMessage('❌ Error exporting to Excel: ' + error.message, 'error');
        }
    }
};
