// queue.js - Queue module with optimized space and inline editing
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
                    <strong>Bulk Actions:</strong>
                    <button class="action-btn booked-btn" onclick="queue.bulkMarkAsBooked()">✅ Mark Selected as Booked</button>
                    <button class="action-btn assign-btn" onclick="queue.showBulkAssignModal()">👥 Assign Selected</button>
                    <button class="action-btn delete-btn" onclick="queue.bulkDelete()">🗑️ Delete Selected</button>
                    <button class="action-btn" onclick="queue.clearSelection()" style="background: #6c757d;">❌ Clear Selection</button>
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
                                    <span>Created: ${createdDate} by ${ticket.created_by}</span>
                                </div>
                            </div>
                            <div class="group-actions-right" style="display: ${isSelected ? 'flex' : 'none'}">
                                <button class="action-btn-small booked-btn" onclick="queue.markAsBooked('${ticket.id}')" title="Mark as Booked">✅</button>
                                <button class="action-btn-small assign-btn" onclick="queue.showAssignModal('${ticket.id}')" title="Assign to Staff">👥</button>
                                <button class="action-btn-small delete-btn" onclick="queue.deleteTicket('${ticket.id}')" title="Delete">🗑️</button>
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
        
        // Add double-click listeners for inline editing
        this.addInlineEditListeners();
    },

    addInlineEditListeners() {
        // Add double-click listeners for inline editing
        document.querySelectorAll('.group-main-info').forEach(element => {
            element.addEventListener('dblclick', (e) => {
                const groupElement = e.target.closest('.passenger-group');
                const ticketId = groupElement.dataset.ticketId;
                this.editTicket(ticketId);
            });
        });
    },

    toggleGroupSelection(ticketId) {
        if (this.selectedGroups.has(ticketId)) {
            this.selectedGroups.delete(ticketId);
        } else {
            this.selectedGroups.add(ticketId);
        }
        
        // Update UI
        const groupElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        const actionsElement = groupElement.querySelector('.group-actions-right');
        
        if (this.selectedGroups.has(ticketId)) {
            groupElement.classList.add('selected');
            actionsElement.style.display = 'flex';
        } else {
            groupElement.classList.remove('selected');
            actionsElement.style.display = 'none';
        }
        
        // Show/hide bulk actions
        this.toggleBulkActions();
    },

    toggleBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        if (this.selectedGroups.size > 0) {
            bulkActions.style.display = 'block';
        } else {
            bulkActions.style.display = 'none';
        }
    },

    clearSelection() {
        this.selectedGroups.clear();
        document.querySelectorAll('.passenger-group').forEach(group => {
            group.classList.remove('selected');
            group.querySelector('.group-actions-right').style.display = 'none';
            group.querySelector('.group-checkbox').checked = false;
        });
        this.toggleBulkActions();
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
                    <button class="close-btn" onclick="queue.closeEditModal()">Cancel</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
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
            this.loadTickets(); // Refresh to show changes
        } catch (error) {
            app.showMessage('❌ Error assigning groups', 'error');
        }
    },

    // ... (keep all other existing methods: formatPassengersDisplay, filterTickets, editTicket, showAssignModal, assignTicket, etc.)
    // Only the displayTickets method is significantly changed

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
    },

    async assignTicket(ticketId, staffName) {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: staffName, created_by: staffName })
            });
            
            const result = await response.json();
            if (result.success) {
                app.showMessage(`✅ Ticket assigned to ${staffName}!`, 'success');
                this.closeEditModal();
                this.loadTickets(); // Refresh to remove from current view
            } else {
                app.showMessage('❌ Error assigning ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    },

    // ... (keep all other existing methods unchanged)
};
