// quickEntry.js - Quick Entry module
const quickEntry = {
    load() {
        this.renderForm();
        this.setDefaultDate();
    },

    renderForm() {
        const quickEntryDiv = document.getElementById('quick-entry');
        quickEntryDiv.innerHTML = `
            <div class="section">
                <h2>Quick Ticket Entry</h2>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="from-station">From Station *</label>
                        <input type="text" id="from-station" placeholder="e.g., Tirur" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="to-station">To Station *</label>
                        <input type="text" id="to-station" placeholder="e.g., Delhi" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="class">Class *</label>
                        <select id="class" required>
                            <option value="">Select Class</option>
                            <option value="Sleeper">Sleeper</option>
                            <option value="3A">3A</option>
                            <option value="2A">2A</option>
                            <option value="1A">1A</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="train-type">Train Type (Optional)</label>
                        <input type="text" id="train-type" placeholder="e.g., Express, Superfast, etc.">
                    </div>
                    
                    <div class="form-group">
                        <label for="journey-date">Journey Date *</label>
                        <input type="date" id="journey-date" required>
                    </div>
                </div>
                
                <!-- Passengers Section -->
                <div class="form-group">
                    <label>Passengers</label>
                    <div style="font-size: 13px; color: #666; margin-bottom: 12px; font-style: italic;">
                        📱 Mobile number (10 digits) only required for first passenger
                    </div>
                    <div id="passengers-list">
                        <div class="passenger-row">
                            <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
                            <input type="number" placeholder="Age" class="passenger-age" min="1" max="120">
                            <select class="passenger-gender">
                                <option value="">Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            <input type="tel" placeholder="Mobile * (10 digits)" class="passenger-mobile" 
                                   maxlength="10" pattern="[0-9]{10}" required>
                        </div>
                    </div>
                    
                    <button onclick="quickEntry.addPassenger()" style="background: #6c757d;">+ Add Companion</button>
                    <div style="font-size: 12px; color: #666; margin-top: 8px; font-style: italic;">
                        Companions don't need mobile numbers
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="remark">Remarks (Optional)</label>
                    <textarea id="remark" rows="3" placeholder="Any additional notes or special requirements..."></textarea>
                </div>
                
                <button onclick="quickEntry.saveTicket()" style="background: #28a745;">💾 Save Ticket</button>
                <button onclick="quickEntry.resetForm()" style="background: #6c757d;">🔄 Reset Form</button>
            </div>
        `;
    },

    addPassenger() {
        const passengersList = document.getElementById('passengers-list');
        const newRow = document.createElement('div');
        newRow.className = 'passenger-row';
        newRow.innerHTML = `
            <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
            <input type="number" placeholder="Age" class="passenger-age" min="1" max="120">
            <select class="passenger-gender">
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
        `;
        passengersList.appendChild(newRow);
    },

    setDefaultDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('journey-date').value = tomorrow.toISOString().split('T')[0];
    },

    resetForm() {
        if (!confirm('Are you sure you want to reset the form? All entered data will be lost.')) return;
        
        document.getElementById('from-station').value = '';
        document.getElementById('to-station').value = '';
        document.getElementById('class').value = '';
        document.getElementById('train-type').value = '';
        document.getElementById('remark').value = '';
        
        // Set tomorrow's date
        this.setDefaultDate();
        
        // Reset passengers
        const passengersList = document.getElementById('passengers-list');
        passengersList.innerHTML = `
            <div class="passenger-row">
                <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
                <input type="number" placeholder="Age" class="passenger-age" min="1" max="120">
                <select class="passenger-gender">
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
                <input type="tel" placeholder="Mobile * (10 digits)" class="passenger-mobile" 
                       maxlength="10" pattern="[0-9]{10}" required>
            </div>
        `;
        
        app.showMessage('Form reset successfully', 'success');
    },

    async saveTicket() {
        try {
            // Validate form
            const fromStation = document.getElementById('from-station').value.trim();
            const toStation = document.getElementById('to-station').value.trim();
            const journeyClass = document.getElementById('class').value;
            const journeyDate = document.getElementById('journey-date').value;
            
            if (!fromStation || !toStation || !journeyClass || !journeyDate) {
                app.showMessage('❌ Please fill all required fields (From, To, Class, Date)', 'error');
                return;
            }

            // Collect passengers
            const passengerRows = document.querySelectorAll('.passenger-row');
            const passengers = [];
            
            for (let i = 0; i < passengerRows.length; i++) {
                const row = passengerRows[i];
                const name = row.querySelector('.passenger-name').value.trim();
                
                if (name) {
                    const passenger = {
                        name: name,
                        age: row.querySelector('.passenger-age').value || '',
                        gender: row.querySelector('.passenger-gender').value || ''
                    };
                    
                    // Only first passenger has mobile
                    if (i === 0) {
                        const mobile = row.querySelector('.passenger-mobile').value.trim();
                        if (!mobile) {
                            app.showMessage('❌ Mobile number is required for the first passenger', 'error');
                            return;
                        }
                        if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
                            app.showMessage('❌ Mobile number must be exactly 10 digits', 'error');
                            return;
                        }
                        passenger.mobile = mobile;
                    }
                    
                    passengers.push(passenger);
                }
            }

            if (passengers.length === 0) {
                app.showMessage('❌ Please add at least one passenger', 'error');
                return;
            }

            // Prepare ticket data
            const ticketData = {
                username: app.currentUser.name,
                from_station: fromStation,
                to_station: toStation,
                class: journeyClass,
                journey_date: journeyDate,
                train_type: document.getElementById('train-type').value.trim(),
                remark: document.getElementById('remark').value.trim(),
                passengers: passengers
            };

            // Save to backend
            const response = await fetch(`${app.API_BASE}/api/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketData)
            });

            const result = await response.json();

            if (result.success) {
                app.showMessage(`✅ Ticket saved successfully!`, 'success');
                this.resetForm();
                // Auto-switch to queue to see the new ticket
                app.showPage('queue');
            } else {
                app.showMessage('❌ Error saving ticket: ' + result.error, 'error');
            }

        } catch (error) {
            app.showMessage('❌ Network error: ' + error.message, 'error');
        }
    }
};
