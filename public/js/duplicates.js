// duplicates.js - Manage flagged duplicate tickets
const duplicates = {
    
    load() {
        this.renderLayout();
        this.loadDuplicates();
    },

    renderLayout() {
        const pageDiv = document.getElementById('duplicates');
        pageDiv.innerHTML = `
            <div class="section">
                <h2 style="color: #f44336">⚠️ Potential Duplicates</h2>
                <div class="queue-controls">
                    <button class="refresh-btn" onclick="duplicates.loadDuplicates()">🔄 Refresh</button>
                    <span id="duplicates-count" style="font-weight: bold; color: #555;">Loading...</span>
                </div>
                
                <div id="duplicates-content">
                    <p>Loading duplicate tickets...</p>
                </div>
            </div>
        `;
    },

    async loadDuplicates() {
        try {
            const content = document.getElementById('duplicates-content');
            const count = document.getElementById('duplicates-count');
            content.innerHTML = '<p>Loading duplicate tickets...</p>';
            
            const response = await fetch(`${app.API_BASE}/api/tickets/duplicates`);
            const tickets = await response.json();

            if (!tickets || tickets.length === 0) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <h3>🎉 No duplicates found!</h3>
                        <p>Your ticket queue is clean.</p>
                    </div>
                `;
                count.textContent = '0 duplicates';
                app.updateDuplicatesCount(); // Update badge
                return;
            }

            this.displayDuplicates(tickets);
            count.textContent = `${tickets.length} duplicates`;
            app.updateDuplicatesCount(); // Update badge

        } catch (error) {
            console.error('Error loading duplicates:', error);
            document.getElementById('duplicates-content').innerHTML = '<p>Error loading tickets.</p>';
        }
    },

    displayDuplicates(tickets) {
        const content = document.getElementById('duplicates-content');
        let html = '<div class="trains-grid">'; // Reuse queue styling

        tickets.forEach(ticket => {
            const journeyDate = new Date(ticket.journey_date).toLocaleDateString();
            const groupPassengerCount = ticket.passengers.split(',').length;
            
            html += `
                <div class="train-sticky-note duplicate-ticket">
                    <div class="train-header">
                        <strong>${ticket.from_station} → ${ticket.to_station}</strong>
                        <span class="passenger-count">${ticket.train_number || 'N/A'}</span>
                    </div>
                    <div class="groups-container">
                        <div class="passenger-group">
                            <div class="group-header">
                                <div class="group-main-info">
                                    <div class="group-basic-info">
                                        <span class="group-passenger-count">${groupPassengerCount} pax</span>
                                        <span class="ticket-class">${ticket.class}</span>
                                        <span>Journey: ${journeyDate}</span>
                                    </div>
                                    <div class="group-meta">
                                        <span>Created by: ${ticket.created_by}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="passengers-list-compact" style="margin-top: 10px;">
                                ${this.formatPassengersDisplay(ticket.passengers)}
                            </div>
                            <div class="contact-info-compact">
                                <strong>📱 ${ticket.mobile || 'N/A'}</strong>
                            </div>
                            
                            <div class="duplicate-info">
                                <strong>Flagged:</strong> ${ticket.duplicate_details.matchType || 'Unknown'}
                                (Matches ID: ${ticket.duplicate_details.matchId || 'N/A'})
                            </div>
                            
                            <div class="duplicate-actions">
                                <button class="action-btn-small edit-btn" onclick="duplicates.unflagTicket('${ticket.id}')">✅ Keep (Unflag)</button>
                                <button class="action-btn-small delete-btn" onclick="duplicates.deleteTicket('${ticket.id}')">🗑️ Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        content.innerHTML = html;
    },

    // Action to unflag a ticket
    async unflagTicket(ticketId) {
        if (!confirm('Are you sure this is not a duplicate? This will unflag it and move it to the main queue.')) {
            return;
        }

        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duplicate_flag: false }) // Just set the flag to false
            });
            const result = await response.json();

            if (result.success) {
                app.showMessage('✅ Ticket unflagged and moved to queue!', 'success');
                this.loadDuplicates(); // Refresh this page
            } else {
                app.showMessage('❌ Error unflagging ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Network Error: ' + error.message, 'error');
        }
    },

    // Action to delete a ticket
    async deleteTicket(ticketId) {
        if (!confirm('Are you sure you want to permanently delete this duplicate ticket?')) {
            return;
        }

        try {
            const response = await fetch(`${app.API_BASE}/api/tickets/${ticketId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                app.showMessage('🗑️ Duplicate ticket deleted.', 'success');
                this.loadDuplicates(); // Refresh this page
            } else {
                app.showMessage('❌ Error deleting ticket', 'error');
            }
        } catch (error) {
            app.showMessage('❌ Network Error: ' + error.message, 'error');
        }
    },

    // === NEW HELPER FUNCTION ===
    // Copied from queue.js to make this file independent
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
    // === END NEW FUNCTION ===
};
