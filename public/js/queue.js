// queue.js - Queue module with optimized space and selection-based actions
const queue = {
    currentEditingTicket: null,
    selectedGroups: new Set(),

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
                
                <!-- Bulk Actions (shown when groups are selected) -->
                <div id="bulk-actions" class="bulk-actions" style="display: none;">
                    <strong>Selected: <span id="selected-count">0</span> groups</strong>
                    <button class="action-btn edit-btn" onclick="queue.bulkEdit()">✏️ Edit Selected</button>
                    <button class="action-btn booked-btn" onclick="queue.bulkMarkAsBooked()">✅ Mark as Booked</button>
                    <button class="action-btn assign-btn" onclick="queue.showBulkAssignModal()">👥 Assign Selected</button>
                    <button class="action-btn delete-btn" onclick="queue.bulkDelete()">🗑️ Delete Selected</button>
                    <button class="action-btn" onclick="queue.clearSelection()" style="background: #6c757d;">❌ Clear</button>
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
                return total + (ticket.passengers.split(',').length);
            }, 0);
            
            html += `
                <div class="route-sticky-note">
                    <div class="route-header">
                        <div class="route-title">
                            <strong>${route}</strong>
                            <span class="passenger-count">👥 ${totalPassengers} passengers • ${routeTickets.length} groups</span>
                        </div>
                    </div>
                    
                    <div class="groups-container">
            `;
            
            routeTickets.forEach((ticket, index) => {
                const createdDate = new Date(ticket.created).toLocaleDateString();
                const journeyDate = ticket.journey_date ? new Date(ticket.journey_date).toLocaleDateString() : 'Not set';
                const groupPassengerCount = ticket.passengers.split(',').length;
                const isSelected = this.selectedGroups.has(ticket.id);
                
                html += `
                    <div class="passenger-group ${isSelected ? 'selected' : ''}" data-ticket-id="${ticket.id}">
                        <div class="group-header">
                            <div class="group-selector">
                                <input type="checkbox" class="group-checkbox" id="group-${ticket.id}" 
                                       ${isSelected ? 'checked' : ''} 
                                       onchange="queue.toggleGroupSelection('${ticket.id}')">
                                <label for="group-${ticket.id}" class="group-number">${index + 1}</label>
                            </div>
                            <div class="group-main-info">
                                <div class="group-basic-info">
                                    <span class="group-passenger-count">${groupPassengerCount} passenger${groupPassengerCount > 1 ? 's' : ''}</span>
                                    <span class="ticket-class">${ticket.class}</span>
                                    ${ticket.train_type ? `<span class="train-type">${ticket.train_type}</span>` : ''}
                                </div>
                                <div class="group-meta">
                                    <span>Journey: ${journeyDate}</span>
                                    <span>Created: ${createdDate}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="group-details-compact">
                            <div class="contact-info-compact">
                                <strong>📱 ${ticket.mobile || 'N/A'}</strong>
                            </div>
                            
                            <div class="passengers-list-compact">
                                ${this.formatPassengersDisplay(ticket.passengers)}
                            </div>
                            
                            ${ticket.remark ? `
                            <div class="group-remark-compact" title="${ticket.remark}">
                                <strong>💡</strong> ${ticket.remark.length > 50 ? ticket.remark.substring(0, 50) + '...' : ticket.remark}
                            </div>
                            ` : ''}
                            
                            <div class="created-by-compact">
                                Created by: ${ticket.created_by}
                            </div>
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

    toggleGroupSelection(ticketId) {
        if (this.selectedGroups.has(ticketId)) {
            this.selectedGroups.delete(ticketId);
        } else {
            this.selectedGroups.add(ticketId);
        }
        
        // Update UI
        const groupElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        if (this.selectedGroups.has(ticketId)) {
            groupElement.classList.add('selected');
        } else {
            groupElement.classList.remove('selected');
        }
        
        // Show/hide bulk actions
        this.toggleBulkActions();
    },

    toggleBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');
        
        if (this.selectedGroups.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedGroups.size;
        } else {
            bulkActions.style.display = 'none';
        }
    },

    clearSelection() {
        this.selectedGroups.clear();
        document.querySelectorAll('.passenger-group').forEach(group => {
            group.classList.remove('selected');
            group.querySelector('.group-checkbox').checked = false;
        });
        this.toggleBulkActions();
    },

    bulkEdit() {
        if (this.selectedGroups.size === 0) return;
        
        if (this.selectedGroups.size === 1) {
            // Single edit - open edit modal for the first selected ticket
            const ticketId = Array.from(this.selectedGroups)[0];
            this.editTicket(ticketId);
        } else {
            app.showMessage('⚠️ Please select only one ticket to edit', 'error');
        }
    },

    async bulkMarkAsBooked() {
        if (this.selectedGroups.size === 0) return;
        
        if (confirm(`Mark ${this.selectedGroups.size} selected groups as booked?`)) {
            const promises = Array.from(this.selectedGroups).map(ticketId => 
                fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'booked' })
                })
            );
            
            try {
                await Promise.all(promises);
                app.showMessage(`✅ ${this.selectedGroups.size} tickets marked as booked!`, 'success');
                this.clearSelection();
                this.loadTickets();
            } catch (error) {
                app.showMessage('❌ Error updating tickets', 'error');
            }
        }
    },

    async bulkDelete() {
        if (this.selectedGroups.size === 0) return;
        
        if (confirm(`Delete ${this.selectedGroups.size} selected groups? This cannot be undone.`)) {
            const promises = Array.from(this.selectedGroups).map(ticketId => 
                fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                    method: 'DELETE'
                })
            );
            
            try {
                await Promise.all(promises);
                app.showMessage(`✅ ${this.selectedGroups.size} tickets deleted!`, 'success');
                this.clearSelection();
                this.loadTickets();
            } catch (error) {
                app.showMessage('❌ Error deleting tickets', 'error');
            }
        }
    },

    showBulkAssignModal() {
        if (this.selectedGroups.size === 0) return;
        
        const staffMembers = ['Ziyad', 'Najad', 'Babu'].filter(name => name !== app.currentUser.name);
        
        const staffList = staffMembers.map(staff => 
            `<button class="staff-assign-btn" onclick="queue.bulkAssignToStaff('${staff}')">
                Assign ${this.selectedGroups.size} groups to ${staff}
            </button>`
        ).join('');
        
        const modal = document.getElementById('editModal');
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>Assign ${this.selectedGroups.size} Groups</h3>
                <p>Select staff member to assign selected groups:</p>
                <div class="staff-list">
                    ${staffList}
                </div>
                <div class="modal-actions">
                    <button type="button" class="close-btn" onclick="queue.closeEditModal()">Cancel</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEditModal();
            }
        });
    },

    async bulkAssignToStaff(staffName) {
        const promises = Array.from(this.selectedGroups).map(ticketId => 
            fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: staffName, created_by: staffName })
            })
        );
        
        try {
            await Promise.all(promises);
            app.showMessage(`✅ ${this.selectedGroups.size} groups assigned to ${staffName}!`, 'success');
            this.closeEditModal();
            this.clearSelection();
            this.loadTickets(); // Refresh to show changes immediately
        } catch (error) {
            app.showMessage('❌ Error assigning groups', 'error');
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
        
        document.getElementById('editForm').addEventListener('submit', (e) => this.saveEditedTicket(e));
        modal.style.display = 'flex';
        
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
                this.clearSelection();
                this.loadTickets();
            } else {
                app.showMessage('❌ Error updating ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    },

    formatPassengersDisplay(passengersString) {
        const passengers = passengersString.split(',').map(p => p.trim());
        return passengers.map(passenger => {
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
                <div class="passenger-item-compact">
                    <span class="passenger-name">${name}</span>
                    ${age ? `<span class="passenger-detail">${age}</span>` : ''}
                    ${gender ? `<span class="passenger-detail">${gender}</span>` : ''}
                </div>
            `;
        }).join('');
    }
};
