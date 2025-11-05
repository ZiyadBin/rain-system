// queue.js - Queue module with vertical layout and group management
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
            
            this.displayTickets(tickets);
            
        } catch (error) {
            app.showMessage('❌ Error loading queue: ' + error.message, 'error');
        }
    },

    displayTickets(tickets) {
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
        
        let html = '<div class="routes-grid">';
        
        Object.keys(routes).forEach(route => {
            const routeTickets = routes[route];
            const totalPassengers = routeTickets.reduce((total, ticket) => {
                // Count passengers from passenger string (e.g., "John (25/Male), Jane (30/Female)" = 2 passengers)
                return total + (ticket.passengers.split(',').length);
            }, 0);
            
            html += `
                <div class="route-sticky-note">
                    <div class="route-header">
                        <div class="route-title">
                            <strong>${route}</strong>
                            <span class="passenger-count">👥 ${totalPassengers} passengers</span>
                        </div>
                    </div>
                    
                    <div class="groups-container">
            `;
            
            routeTickets.forEach((ticket, index) => {
                const createdDate = new Date(ticket.created).toLocaleDateString();
                const journeyDate = ticket.journey_date ? new Date(ticket.journey_date).toLocaleDateString() : 'Not set';
                const groupPassengerCount = ticket.passengers.split(',').length;
                
                html += `
                    <div class="passenger-group">
                        <div class="group-header">
                            <div class="group-selector">
                                <input type="checkbox" class="group-checkbox" id="group-${ticket.id}">
                                <label for="group-${ticket.id}" class="group-number">${index + 1}</label>
                            </div>
                            <div class="group-info">
                                <span class="group-passenger-count">${groupPassengerCount} passenger${groupPassengerCount > 1 ? 's' : ''}</span>
                                <span class="group-meta">Created: ${createdDate} • Journey: ${journeyDate}</span>
                            </div>
                        </div>
                        
                        <div class="group-details">
                            <div class="ticket-class">${ticket.class} Class</div>
                            ${ticket.train_type ? `<div class="train-type">${ticket.train_type}</div>` : ''}
                            
                            <div class="passengers-list">
                                ${this.formatPassengersDisplay(ticket.passengers)}
                            </div>
                            
                            <div class="contact-info">
                                <strong>📱 ${ticket.mobile || 'N/A'}</strong>
                            </div>
                            
                            ${ticket.remark ? `
                            <div class="group-remark">
                                <strong>Remarks:</strong> ${ticket.remark}
                            </div>
                            ` : ''}
                            
                            <div class="created-by">
                                Created by: ${ticket.created_by}
                            </div>
                        </div>
                        
                        <div class="group-actions">
                            <button class="action-btn booked-btn" onclick="queue.markAsBooked('${ticket.id}')">
                                ✅ Booked
                            </button>
                            <button class="action-btn edit-btn" onclick="queue.editTicket('${ticket.id}')">
                                ✏️ Edit
                            </button>
                            <button class="action-btn assign-btn" onclick="queue.showAssignModal('${ticket.id}')">
                                👥 Assign
                            </button>
                            <button class="action-btn delete-btn" onclick="queue.deleteTicket('${ticket.id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        queueContent.innerHTML = html;
        document.getElementById('queue-count').textContent = `${tickets.length} tickets`;
    },

    formatPassengersDisplay(passengersString) {
        // Convert "John (25/Male), Jane (30/Female)" to formatted HTML
        const passengers = passengersString.split(',').map(p => p.trim());
        return passengers.map(passenger => {
            // Extract name, age, gender
            const nameMatch = passenger.match(/^([^(]+)/);
            const detailsMatch = passenger.match(/\(([^)]+)\)/);
            
            const name = nameMatch ? nameMatch[0].trim() : passenger;
            let age = '', gender = '';
            
            if (detailsMatch) {
                const details = detailsMatch[1].split('/');
                age = details[0] || '';
                gender = details[1] || '';
            }
            
            return `
                <div class="passenger-item">
                    <span class="passenger-name">${name}</span>
                    ${age ? `<span class="passenger-age">${age}</span>` : ''}
                    ${gender ? `<span class="passenger-gender">${gender}</span>` : ''}
                </div>
            `;
        }).join('');
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
            this.renderEditModal(ticket);
            
        } catch (error) {
            app.showMessage('❌ Error loading ticket: ' + error.message, 'error');
        }
    },

    showAssignModal(ticketId) {
        // Simple assign functionality - you can enhance this with a proper modal
        const staffMembers = ['Ziyad', 'Najad', 'Babu'].filter(name => name !== app.currentUser.name);
        
        const staffList = staffMembers.map(staff => 
            `<button class="staff-assign-btn" onclick="queue.assignTicket('${ticketId}', '${staff}')">
                Assign to ${staff}
            </button>`
        ).join('');
        
        const modal = document.getElementById('editModal');
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>Assign Ticket</h3>
                <p>Select staff member to assign this ticket:</p>
                <div class="staff-list">
                    ${staffList}
                </div>
                <div class="modal-actions">
                    <button class="close-btn" onclick="queue.closeEditModal()">Cancel</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    },

    async assignTicket(ticketId, staffName) {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: staffName })
            });
            
            const result = await response.json();
            if (result.success) {
                app.showMessage(`✅ Ticket assigned to ${staffName}!`, 'success');
                this.closeEditModal();
                this.loadTickets();
            } else {
                app.showMessage('❌ Error assigning ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    },

    // ... (keep the existing editModal, saveEditedTicket, deleteTicket, markAsBooked methods)
    // Just add this new method:

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
        
        document.getElementById('editForm').addEventListener('submit', (e) => this.saveEditedTicket(e));
        modal.style.display = 'flex';
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    },

    // ... (keep all other existing methods: closeEditModal, saveEditedTicket, deleteTicket, markAsBooked)
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
