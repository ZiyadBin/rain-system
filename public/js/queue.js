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
            console.log('👤 User:', app.currentUser.name);

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
            console.log('✅ Tickets loaded:', tickets);
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

    // ... rest of the queue.js code remains the same
};
