// queue.js - Queue module
const queue = {
    currentEditingTicket: null,

    load() {
        this.renderQueue();
        this.loadTickets();
    },

    renderQueue() {
        const queueDiv = document.getElementById('queue');
        queueDiv.innerHTML = `
            <div class="section">
                <h2>Ticket Queue</h2>
                <div class="queue-controls">
                    <button class="refresh-btn" onclick="queue.loadTickets()">🔄 Refresh Queue</button>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <strong>Filter:</strong>
                        <button class="filter-btn active" onclick="queue.filterTickets('MY')">My Tickets</button>
                        <button class="filter-btn" onclick="queue.filterTickets('Ziyad')">Ziyad</button>
                        <button class="filter-btn" onclick="queue.filterTickets('Najad')">Najad</button>
                        <button class="filter-btn" onclick="queue.filterTickets('Babu')">Babu</button>
                        <button class="filter-btn" onclick="queue.filterTickets('ALL')">All Tickets</button>
                    </div>
                    <span id="queue-count" style="font-weight: bold; color: #555;">Loading...</span>
                </div>
                <div id="queue-content">
                    <p>Loading tickets...</p>
                </div>
            </div>
        `;
    },

    async loadTickets() {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets?filter=${app.currentFilter}`, {
                headers: {
                    'User-Name': app.currentUser.name
                }
            });
            const tickets = await response.json();
            
            const queueContent = document.getElementById('queue-content');
            
            if (!tickets || tickets.length === 0) {
                queueContent.innerHTML = '<p>No tickets found with current filter.</p>';
                document.getElementById('queue-count').textContent = '0 tickets';
                return;
            }
            
            // Group by route
            const routes = {};
            tickets.forEach(ticket => {
                const route = `${ticket.from_station} → ${ticket.to_station}`;
                if (!routes[route]) routes[route] = [];
                routes[route].push(ticket);
            });
            
            let html = '';
            Object.keys(routes).forEach(route => {
                html += `<div class="route-header">${route}</div>`;
                html += `<div class="queue-container">`;
                
                routes[route].forEach(ticket => {
                    const createdDate = new Date(ticket.created).toLocaleDateString();
                    const journeyDate = ticket.journey_date ? new Date(ticket.journey_date).toLocaleDateString() : 'Not set';
                    const firstPassengerName = ticket.passengers.split(',')[0].split(' (')[0];
                    
                    html += `
                        <div class="sticky-note">
                            <div class="note-header">
                                <span class="note-id">${firstPassengerName}</span>
                                <span class="note-status">${ticket.status}</span>
                            </div>
                            
                            <div class="note-details">
                                <div class="note-detail">
                                    <span class="detail-label">Ticket ID:</span>
                                    <span class="detail-value">${ticket.id}</span>
                                </div>
                                <div class="note-detail">
                                    <span class="detail-label">Class:</span>
                                    <span class="detail-value">${ticket.class}</span>
                                </div>
                                <div class="note-detail">
                                    <span class="detail-label">Journey:</span>
                                    <span class="detail-value">${journeyDate}</span>
                                </div>
                                ${ticket.train_type ? `
                                <div class="note-detail">
                                    <span class="detail-label">Train Type:</span>
                                    <span class="detail-value">${ticket.train_type}</span>
                                </div>
                                ` : ''}
                                <div class="note-detail">
                                    <span class="detail-label">Mobile:</span>
                                    <span class="detail-value">${ticket.mobile || 'N/A'}</span>
                                </div>
                                <div class="note-detail">
                                    <span class="detail-label">Created By:</span>
                                    <span class="detail-value">${ticket.created_by}</span>
                                </div>
                                <div class="note-detail">
                                    <span class="detail-label">Created:</span>
                                    <span class="detail-value">${createdDate}</span>
                                </div>
                            </div>
                            
                            <div class="note-passengers">
                                <strong>Passengers:</strong> ${ticket.passengers}
                            </div>
                            
                            ${ticket.remark ? `
                            <div class="note-passengers">
                                <strong>Remarks:</strong> ${ticket.remark}
                            </div>
                            ` : ''}
                            
                            <div class="note-actions">
                                <button class="btn-small" style="background: #28a745;" onclick="queue.markAsBooked('${ticket.id}')">✅ Booked</button>
                                <button class="btn-small" style="background: #17a2b8;" onclick="queue.editTicket('${ticket.id}')">✏️ Edit</button>
                                <button class="btn-small" style="background: #dc3545;" onclick="queue.deleteTicket('${ticket.id}')">🗑️ Delete</button>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            });
            
            queueContent.innerHTML = html;
            document.getElementById('queue-count').textContent = `${tickets.length} tickets`;
            
        } catch (error) {
            app.showMessage('❌ Error loading queue: ' + error.message, 'error');
        }
    },

    filterTickets(filter) {
        app.currentFilter = filter;
        this.loadTickets();
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    },

    async editTicket(ticketId) {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`);
            const ticket = await response.json();
            
            this.currentEditingTicket = ticket;
            
            // Render edit modal
            this.renderEditModal(ticket);
            
        } catch (error) {
            app.showMessage('❌ Error loading ticket: ' + error.message, 'error');
        }
    },

    renderEditModal(ticket) {
        const modal = document.getElementById('editModal');
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>Edit Ticket</h3>
                <form id="editForm">
                    <div class="edit-form-group">
                        <label for="edit-from-station">From Station</label>
                        <input type="text" id="edit-from-station" value="${ticket.from_station}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-to-station">To Station</label>
                        <input type="text" id="edit-to-station" value="${ticket.to_station}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-class">Class</label>
                        <select id="edit-class" required>
                            <option value="Sleeper" ${ticket.class === 'Sleeper' ? 'selected' : ''}>Sleeper</option>
                            <option value="3A" ${ticket.class === '3A' ? 'selected' : ''}>3A</option>
                            <option value="2A" ${ticket.class === '2A' ? 'selected' : ''}>2A</option>
                            <option value="1A" ${ticket.class === '1A' ? 'selected' : ''}>1A</option>
                        </select>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-train-type">Train Type</label>
                        <input type="text" id="edit-train-type" value="${ticket.train_type || ''}">
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-journey-date">Journey Date</label>
                        <input type="date" id="edit-journey-date" value="${ticket.journey_date}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-status">Status</label>
                        <select id="edit-status" required>
                            <option value="received" ${ticket.status === 'received' ? 'selected' : ''}>Received</option>
                            <option value="assigned" ${ticket.status === 'assigned' ? 'selected' : ''}>Assigned</option>
                            <option value="booked" ${ticket.status === 'booked' ? 'selected' : ''}>Booked</option>
                        </select>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-remark">Remarks</label>
                        <textarea id="edit-remark" rows="3">${ticket.remark || ''}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="close-btn" onclick="queue.closeEditModal()">Cancel</button>
                        <button type="submit" class="save-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        // Add event listener for form submission
        document.getElementById('editForm').addEventListener('submit', (e) => this.saveEditedTicket(e));
        
        // Show the modal
        modal.style.display = 'flex';
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    },

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditingTicket = null;
    },

    async saveEditedTicket(event) {
        event.preventDefault();
        
        try {
            const updates = {
                from_station: document.getElementById('edit-from-station').value,
                to_station: document.getElementById('edit-to-station').value,
                class: document.getElementById('edit-class').value,
                train_type: document.getElementById('edit-train-type').value,
                journey_date: document.getElementById('edit-journey-date').value,
                status: document.getElementById('edit-status').value,
                remark: document.getElementById('edit-remark').value
            };

            const response = await fetch(`${app.API_BASE}/api/tickets/${this.currentEditingTicket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            const result = await response.json();
            if (result.success) {
                app.showMessage('✅ Ticket updated successfully!', 'success');
                this.closeEditModal();
                this.loadTickets();
            } else {
                app.showMessage('❌ Error updating ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    },

    async deleteTicket(ticketId) {
        if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
            try {
                const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                if (result.success) {
                    app.showMessage('✅ Ticket deleted successfully!', 'success');
                    this.loadTickets();
                } else {
                    app.showMessage('❌ Error deleting ticket', 'error');
                }
            } catch (error) {
                app.showMessage('❌ Error deleting ticket: ' + error.message, 'error');
            }
        }
    },

    async markAsBooked(ticketId) {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'booked' })
            });
            
            const result = await response.json();
            if (result.success) {
                app.showMessage('✅ Ticket marked as booked!', 'success');
                this.loadTickets();
            } else {
                app.showMessage('❌ Error updating ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    }
};
