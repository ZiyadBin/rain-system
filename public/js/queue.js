// queue.js - Enhanced with AC/Non-AC queues and train-based grouping
const queue = {
    currentEditingTicket: null,
    selectedGroups: new Set(),
    currentQueueType: 'AC', // 'AC' or 'NON_AC'

    load(queueType = 'AC') {
        this.currentQueueType = queueType;
        this.renderQueue();
        this.loadTickets();
    },

    renderQueue() {
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
        const queueTitle = this.currentQueueType === 'AC' ? 'AC Queue' : 'Non-AC Queue';
        const queueColor = this.currentQueueType === 'AC' ? '#2196F3' : '#FF9800';
        
        queueDiv.innerHTML = `
            <div class="section">
                <h2 style="color: ${queueColor}">🚅 ${queueTitle}</h2>
                <div class="queue-controls">
                    <button class="refresh-btn" onclick="queue.loadTickets()">🔄 Refresh</button>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <strong>Filter:</strong>
                        <button class="filter-btn ${app.currentFilter === 'MY' ? 'active' : ''}" onclick="queue.filterTickets('MY')">My Tickets</button>
                        <button class="filter-btn ${app.currentFilter === 'ALL' ? 'active' : ''}" onclick="queue.filterTickets('ALL')">All Tickets</button>
                    </div>
                    <span id="queue-count" style="font-weight: bold; color: #555;">Loading...</span>
                </div>
                
                <!-- Bulk Actions -->
                <div id="bulk-actions" class="bulk-actions" style="display: none;">
                    <strong>Selected: <span id="selected-count">0</span> groups</strong>
                    <button class="action-btn edit-btn" onclick="queue.bulkEdit()">✏️ Edit Selected</button>
                    <button class="action-btn booked-btn" onclick="queue.showPnrModal()">✅ Mark as Booked</button>
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
            console.log('🔄 Loading tickets for:', this.currentQueueType);
            console.log('🔗 API URL:', `${app.API_BASE}/api/tickets?filter=${app.currentFilter}&type=${this.currentQueueType}`);

            const response = await fetch(`${app.API_BASE}/api/tickets?filter=${app.currentFilter}&type=${this.currentQueueType}`, {
                headers: {
                    'User-Name': app.currentUser.name
                }
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const tickets = await response.json();
            console.log('✅ Tickets loaded:', tickets.length);
            this.displayTickets(tickets);
            
        } catch (error) {
            console.error('❌ Error loading tickets:', error);
            app.showMessage('❌ Error loading queue: ' + error.message, 'error');
            document.getElementById('queue-content').innerHTML = '<p>Error loading tickets. Please try again.</p>';
        }
    },

    displayTickets(tickets) {
        const queueContent = document.getElementById('queue-content');
        
        if (!tickets || tickets.length === 0) {
            queueContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>🎉 No tickets found!</h3>
                    <p>No tickets found with current filter "${app.currentFilter}" in ${this.currentQueueType} queue.</p>
                    <p>Try changing the filter or create a new ticket.</p>
                </div>
            `;
            document.getElementById('queue-count').textContent = '0 tickets';
            return;
        }
        
        console.log('🎫 Displaying tickets:', tickets.length);
        
        // Group by train number/name
        const trains = {};
        tickets.forEach(ticket => {
            const trainKey = ticket.train_number || 'Unknown Train';
            if (!trains[trainKey]) trains[trainKey] = [];
            trains[trainKey].push(ticket);
        });
        
        let html = '<div class="trains-grid">';
        
        Object.keys(trains).forEach(train => {
            const trainTickets = trains[train];
            const totalPassengers = trainTickets.reduce((total, ticket) => {
                return total + (ticket.passengers.split(',').length);
            }, 0);
            
            const bgColor = this.currentQueueType === 'AC' ? 
                'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' : 
                'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)';
            
            const borderColor = this.currentQueueType === 'AC' ? '#2196F3' : '#FF9800';
            
            html += `
                <div class="train-sticky-note" style="background: ${bgColor}; border-color: ${borderColor}">
                    <div class="train-header">
                        <div class="train-title">
                            <strong>${train}</strong>
                            <span class="passenger-count">👥 ${totalPassengers} passengers • ${trainTickets.length} groups</span>
                        </div>
                    </div>
                    
                    <div class="groups-container">
            `;
            
            trainTickets.forEach((ticket, index) => {
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
                                    <span class="route-info">${ticket.from_station} → ${ticket.to_station}</span>
                                </div>
                                <div class="group-meta">
                                    <span>Journey: ${journeyDate}</span>
                                    <span>Created: ${createdDate} by ${ticket.created_by}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="group-details-compact">
                            ${ticket.boarding_station ? `
                            <div class="boarding-info">
                                <strong>Boarding:</strong> ${ticket.boarding_station}
                            </div>
                            ` : ''}
                            
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
    },

    // FIXED: Added missing function
    showSinglePnrModal(ticketId) {
        const modal = document.getElementById('pnrModal');
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>🎫 Mark as Booked</h3>
                <p>Enter PNR number for this ticket:</p>
                <div class="edit-form-group">
                    <label for="pnr-number">PNR Number *</label>
                    <input type="text" id="pnr-number" placeholder="Enter 10-digit PNR" maxlength="10" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="close-btn" onclick="queue.closePnrModal()">Cancel</button>
                    <button type="button" class="save-btn" onclick="queue.markAsBooked('${ticketId}')">✅ Mark as Booked</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePnrModal();
            }
        });
    },

    showPnrModal() {
        if (this.selectedGroups.size === 0) {
            app.showMessage('⚠️ Please select at least one ticket', 'error');
            return;
        }
        
        if (this.selectedGroups.size === 1) {
            const ticketId = Array.from(this.selectedGroups)[0];
            this.showSinglePnrModal(ticketId);
        } else {
            app.showMessage('⚠️ Please select only one ticket to mark as booked', 'error');
        }
    },

    closePnrModal() {
        document.getElementById('pnrModal').style.display = 'none';
    },

    // UPDATED: Mark as booked using new API (no Google Sheets)
    async markAsBooked(ticketId) {
        const pnrNumber = document.getElementById('pnr-number').value.trim();
        
        if (!pnrNumber) {
            app.showMessage('❌ Please enter PNR number', 'error');
            return;
        }

        if (pnrNumber.length !== 10) {
            app.showMessage('❌ PNR must be exactly 10 digits', 'error');
            return;
        }

        try {
            console.log('📤 Marking ticket as booked:', { ticketId, pnrNumber });

            // Use the new booked tickets API
            const response = await fetch(`${app.API_BASE}/api/booked`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticketId: ticketId,
                    pnr: pnrNumber
                })
            });

            if (!response.ok) {
                throw new Error(`API error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Mark as booked response:', result);

            if (result.success) {
                app.showMessage('✅ Ticket marked as booked and moved to history!', 'success');
                this.closePnrModal();
                this.clearSelection();
                this.loadTickets(); // Refresh the queue
            } else {
                app.showMessage('❌ Error marking as booked: ' + (result.error || 'Unknown error'), 'error');
            }

        } catch (error) {
            console.error('❌ Mark as booked error:', error);
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    },

    // FIXED: Added missing delete function
    async deleteTicketFromQueue(ticketId) {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete ticket');
            }
            return result;
        } catch (error) {
            console.error('Error deleting ticket:', error);
            throw error;
        }
    },

    toggleGroupSelection(ticketId) {
        if (this.selectedGroups.has(ticketId)) {
            this.selectedGroups.delete(ticketId);
        } else {
            this.selectedGroups.add(ticketId);
        }
        
        // Update UI
        const groupElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
        if (groupElement) {
            if (this.selectedGroups.has(ticketId)) {
                groupElement.classList.add('selected');
            } else {
                groupElement.classList.remove('selected');
            }
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
            const checkbox = group.querySelector('.group-checkbox');
            if (checkbox) checkbox.checked = false;
        });
        this.toggleBulkActions();
    },

    bulkEdit() {
        if (this.selectedGroups.size === 0) return;
        
        if (this.selectedGroups.size === 1) {
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
                this.deleteTicketFromQueue(ticketId)
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
        
        // Load users for assignment
        auth.loadUsers().then(() => {
            const staffMembers = auth.users.filter(user => user.username !== app.currentUser.username);
            
            const staffList = staffMembers.map(staff => 
                `<button class="staff-assign-btn" onclick="queue.bulkAssignToStaff('${staff.name}')">
                    Assign ${this.selectedGroups.size} groups to ${staff.name}
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
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeEditModal();
                }
            });
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
            this.loadTickets();
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
                        <label for="edit-train-number">Train Number/Name</label>
                        <input type="text" id="edit-train-number" value="${ticket.train_number}" required>
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-boarding-station">Boarding Station</label>
                        <input type="text" id="edit-boarding-station" value="${ticket.boarding_station || ''}">
                    </div>
                    <div class="edit-form-group">
                        <label for="edit-class">Class</label>
                        <select id="edit-class" required>
                            <option value="1A" ${ticket.class === '1A' ? 'selected' : ''}>First AC (1A)</option>
                            <option value="2A" ${ticket.class === '2A' ? 'selected' : ''}>AC 2 Tier (2A)</option>
                            <option value="3A" ${ticket.class === '3A' ? 'selected' : ''}>AC 3 Tier (3A)</option>
                            <option value="CC" ${ticket.class === 'CC' ? 'selected' : ''}>AC Chair Car (CC)</option>
                            <option value="EC" ${ticket.class === 'EC' ? 'selected' : ''}>Executive Chair Car (EC)</option>
                            <option value="SL" ${ticket.class === 'SL' ? 'selected' : ''}>Sleeper (SL)</option>
                            <option value="2S" ${ticket.class === '2S' ? 'selected' : ''}>Second Seating (2S)</option>
                        </select>
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
                train_number: document.getElementById('edit-train-number').value,
                boarding_station: document.getElementById('edit-boarding-station').value,
                class: document.getElementById('edit-class').value,
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
