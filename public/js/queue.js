// queue.js - v2 Card Layout
const queue = {
    currentEditingTicket: null,
    selectedGroups: new Set(),
    currentQueueType: 'AC', // 'AC' or 'NON_AC'

    async load(queueType = 'AC') {
        this.currentQueueType = queueType;
        await this.renderQueue(); 
        this.loadTickets(); 
    },

    async renderQueue() {
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
        const queueTitle = this.currentQueueType === 'AC' ? 'AC Queue' : 'Non-AC Queue';
        const queueColor = this.currentQueueType === 'AC' ? '#2196F3' : '#FF9800';
        
        queueDiv.innerHTML = `
            <div class="section">
                <h2 style="color: ${queueColor}">🚅 ${queueTitle}</h2>
                <div class="queue-controls">
                    <button class="refresh-btn" onclick="queue.loadTickets()">🔄 Refresh</button>
                    <div id="queue-filter-buttons" style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        </div>
                    <span id="queue-count" style="font-weight: bold; color: #555;">Loading...</span>
                </div>
                
                <div id="bulk-actions" class="bulk-actions" style="display: none;">
                    <strong>Selected: <span id="selected-count">0</span> groups</strong>
                    <button class="action-btn edit-btn" onclick="queue.bulkEdit()">✏️ Edit</button>
                    <button class="action-btn booked-btn" onclick="queue.showPnrModal()">✅ Booked</button>
                    <button class="action-btn assign-btn" onclick="queue.showBulkAssignModal()">👥 Assign</button>
                    <button class="action-btn delete-btn" onclick="queue.bulkDelete()">🗑️ Delete</button>
                    <button class="action-btn" onclick="queue.clearSelection()" style="background: #6c757d;">❌ Clear</button>
                </div>
                
                <div id="queue-content">
                    <p>Loading tickets...</p>
                </div>
            </div>
        `;
        await this.renderFilterButtons();
    },

    async renderFilterButtons() {
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
        const filterContainer = queueDiv.querySelector('#queue-filter-buttons');
        if (!filterContainer) return;

        let buttonsHtml = `
            <strong>Filter:</strong>
            <button class="filter-btn ${app.currentFilter === 'MY' ? 'active' : ''}" onclick="queue.filterTickets('MY', event)">My Tickets</button>
            <button class="filter-btn ${app.currentFilter === 'ALL' ? 'active' : ''}" onclick="queue.filterTickets('ALL', event)">All Tickets</button>
        `;
        const users = await auth.loadUsers(); 
        users.forEach(user => {
            if (user.name !== app.currentUser.name) {
                buttonsHtml += `
                    <button class="filter-btn ${app.currentFilter === user.name ? 'active' : ''}" onclick="queue.filterTickets('${user.name}', event)">${user.name}'s</button>
                `;
            }
        });
        filterContainer.innerHTML = buttonsHtml;
    },

    async loadTickets() {
        let queueDiv, queueContent, queueCount;
        try {
            queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
            queueContent = queueDiv.querySelector('#queue-content');
            queueCount = queueDiv.querySelector('#queue-count');

            if (!queueContent || !queueCount) return;

            queueContent.innerHTML = '<p>Loading tickets...</p>';
            queueCount.textContent = 'Loading...';

            const response = await fetch(`${app.API_BASE}/api/tickets?filter=${app.currentFilter}&type=${this.currentQueueType}`, {
                headers: { 'User-Name': app.currentUser.name }
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const tickets = await response.json();
            this.displayTickets(tickets);
            
        } catch (error) {
            console.error('❌ Error loading tickets:', error);
            if (queueContent) queueContent.innerHTML = '<p>Error loading tickets. Please try again.</p>';
        }
    },

    // === CHANGED ===
    // This function now builds the new, compact v2 card
    displayTickets(tickets) {
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
        const queueContent = queueDiv.querySelector('#queue-content');
        const queueCount = queueDiv.querySelector('#queue-count');

        if (!queueContent || !queueCount) return;

        if (!tickets || tickets.length === 0) {
            queueContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>🎉 No tickets found!</h3>
                    <p>No tickets found in ${this.currentQueueType} queue.</p>
                </div>`;
            queueCount.textContent = '0 tickets';
            return;
        }
        
        // Group by train number
        const trains = {};
        tickets.forEach(ticket => {
            const trainKey = ticket.train_number || 'Unknown Train';
            if (!trains[trainKey]) trains[trainKey] = [];
            trains[trainKey].push(ticket);
        });
        
        let html = '<div class="trains-grid">';
        
        Object.keys(trains).forEach(train => {
            const trainTickets = trains[train];
            const totalPassengers = trainTickets.reduce((total, t) => total + t.passengers.split(',').length, 0);
            const trainColor = this.currentQueueType === 'AC' ? '#2196F3' : '#FF9800';

            html += `
                <div class="train-sticky-note" style="border-color: ${trainColor}">
                    <div class="train-header">
                        <strong>${train}</strong>
                        <span class="passenger-count" style="background-color: ${trainColor}">
                            👥 ${totalPassengers} PAX • ${trainTickets.length} groups
                        </span>
                    </div>
                    <div class="groups-container">
            `;
            
            trainTickets.forEach((ticket, index) => {
                const createdDate = new Date(ticket.created).toLocaleDateString();
                const journeyDate = ticket.journey_date ? new Date(ticket.journey_date).toLocaleDateString() : 'Not set';
                const groupPassengerCount = ticket.passengers.split(',').length;
                const isSelected = this.selectedGroups.has(ticket.id);
                
                // New logic for route string
                let routeString = `${ticket.from_station} → ${ticket.to_station}`;
                if (ticket.boarding_station) {
                    routeString = `${ticket.from_station} → ${ticket.boarding_station} → ${ticket.to_station}`;
                }
                
                html += `
                    <div class="passenger-group-v2 ${isSelected ? 'selected' : ''}" data-ticket-id="${ticket.id}">
                        
                        <div class="group-created-by">
                            Created: ${createdDate} by ${ticket.created_by}
                        </div>

                        <div class="group-main-content">
                            <div class="group-header-v2">
                                <div class="group-selector">
                                    <input type="checkbox" class="group-checkbox" id="group-${ticket.id}" 
                                           ${isSelected ? 'checked' : ''} 
                                           onchange="queue.toggleGroupSelection('${ticket.id}')">
                                    <label for="group-${ticket.id}" class="group-number">${index + 1}</label>
                                </div>
                                <div class="group-basic-info-v2">
                                    <span class="group-passenger-count">${groupPassengerCount} PAX</span>
                                    <span class="ticket-class">${ticket.class}</span>
                                    <span class="route-info">${routeString}</span>
                                </div>
                            </div>
                            
                            <div class="passengers-list-compact">
                                ${this.formatPassengersDisplay(ticket.passengers)}
                            </div>
                            
                            <div class="group-meta-v2">
                                <span>Journey: ${journeyDate}</span>
                                <span>📱 ${ticket.mobile || 'N/A'}</span>
                            </div>
                            
                            ${ticket.remark ? `
                            <div class="group-remark-compact" title="${ticket.remark}">
                                <strong>💡</strong> ${ticket.remark.substring(0, 50)}...
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
        queueCount.textContent = `${tickets.length} tickets`;
    },

    // ... (showSinglePnrModal, showPnrModal, closePnrModal, markAsBooked, deleteTicketFromQueue are unchanged)
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
            </div>`;
        modal.style.display = 'flex';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closePnrModal();
        });
    },
    showPnrModal() {
        if (this.selectedGroups.size === 0) {
            app.showMessage('⚠️ Please select at least one ticket', 'error'); return;
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
    async markAsBooked(ticketId) {
        const pnrNumber = document.getElementById('pnr-number').value.trim();
        if (!pnrNumber || pnrNumber.length !== 10) {
            app.showMessage('❌ PNR must be exactly 10 digits', 'error'); return;
        }
        try {
            const response = await fetch(`${app.API_BASE}/api/booked`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: ticketId, pnr: pnrNumber })
            });
            if (!response.ok) throw new Error(`API error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                app.showMessage('✅ Ticket marked as booked and moved to history!', 'success');
                this.closePnrModal();
                this.clearSelection();
                this.loadTickets();
            } else {
                app.showMessage('❌ Error marking as booked: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            app.showMessage('❌ Error: ' + error.message, 'error');
        }
    },
    async deleteTicketFromQueue(ticketId) {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to delete ticket');
            return result;
        } catch (error) {
            console.error('Error deleting ticket:', error);
            throw error;
        }
    },
    
    // (toggleGroupSelection is unchanged, it targets the parent div)
    toggleGroupSelection(ticketId) {
        if (this.selectedGroups.has(ticketId)) {
            this.selectedGroups.delete(ticketId);
        } else {
            this.selectedGroups.add(ticketId);
        }
        
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
        const groupElement = queueDiv.querySelector(`[data-ticket-id="${ticketId}"]`);
        
        if (groupElement) {
            groupElement.classList.toggle('selected', this.selectedGroups.has(ticketId));
        }
        this.toggleBulkActions();
    },

    // (toggleBulkActions is unchanged)
    toggleBulkActions() {
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
        const bulkActions = queueDiv.querySelector('#bulk-actions');
        const selectedCount = queueDiv.querySelector('#selected-count');

        if (!bulkActions || !selectedCount) return;
        
        if (this.selectedGroups.size > 0) {
            bulkActions.style.display = 'flex';
            selectedCount.textContent = this.selectedGroups.size;
        } else {
            bulkActions.style.display = 'none';
        }
    },

    // === CHANGED ===
    // Must find the new class name `.passenger-group-v2`
    clearSelection() {
        this.selectedGroups.clear();
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');

        queueDiv.querySelectorAll('.passenger-group-v2').forEach(group => {
            group.classList.remove('selected');
            const checkbox = group.querySelector('.group-checkbox');
            if (checkbox) checkbox.checked = false;
        });
        this.toggleBulkActions();
    },

    // (bulkEdit is unchanged)
    bulkEdit() {
        if (this.selectedGroups.size === 0) return;
        if (this.selectedGroups.size === 1) {
            const ticketId = Array.from(this.selectedGroups)[0];
            this.editTicket(ticketId);
        } else {
            app.showMessage('⚠️ Please select only one ticket to edit', 'error');
        }
    },

    // (bulkDelete is unchanged)
    async bulkDelete() {
        if (this.selectedGroups.size === 0) return;
        if (confirm(`Delete ${this.selectedGroups.size} selected groups? This cannot be undone.`)) {
            const promises = Array.from(this.selectedGroups).map(id => this.deleteTicketFromQueue(id));
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

    // (showBulkAssignModal is unchanged)
    async showBulkAssignModal() {
        if (this.selectedGroups.size === 0) return;
        const users = await auth.loadUsers();
        const staffMembers = users.filter(user => user.username !== app.currentUser.username);
        const staffList = staffMembers.map(staff => 
            `<button class="staff-assign-btn" onclick="queue.bulkAssignToStaff('${staff.name}')">
                Assign ${this.selectedGroups.size} groups to ${staff.name}
            </button>`
        ).join('');
        
        const modal = document.getElementById('editModal');
        modal.innerHTML = `
            <div class="edit-modal-content">
                <h3>Assign ${this.selectedGroups.size} Groups</h3>
                <div class="staff-list">
                    ${staffList.length > 0 ? staffList : '<p>No other staff members found.</p>'}
                </div>
                <div class="modal-actions">
                    <button type="button" class="close-btn" onclick="queue.closeEditModal()">Cancel</button>
                </div>
            </div>`;
        modal.style.display = 'flex';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeEditModal();
        });
    },

    // (bulkAssignToStaff is unchanged)
    async bulkAssignToStaff(staffName) {
        const promises = Array.from(this.selectedGroups).map(ticketId => 
            fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ created_by: staffName })
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

    // (filterTickets is unchanged)
    filterTickets(filter, event) {
        app.currentFilter = filter;
        this.loadTickets();
        const queueDiv = document.getElementById(this.currentQueueType === 'AC' ? 'ac-queue' : 'non-ac-queue');
        queueDiv.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        if (event && event.target) event.target.classList.add('active');
    },

    // (editTicket, renderEditModal, closeEditModal, saveEditedTicket are unchanged)
    async editTicket(ticketId) { /* ... */ },
    renderEditModal(ticket) { /* ... */ },
    closeEditModal() { /* ... */ },
    async saveEditedTicket(event) { /* ... */ },

    // (formatPassengersDisplay is unchanged but CRITICAL for the new layout)
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

// --- PASTE IN UNCHANGED FUNCTIONS ---
// (To be safe, I will paste the full, unchanged functions here)
Object.assign(queue, {
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
                        <label for="edit-journey-date">Journey Date</label>
                        <input type="date" id="edit-journey-date" value="${ticket.journey_date}" required>
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
            </div>`;
        document.getElementById('editForm').addEventListener('submit', (e) => this.saveEditedTicket(e));
        modal.style.display = 'flex';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeEditModal();
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
    }
});
