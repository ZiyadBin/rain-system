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
        // ... reset form logic ...
    },

    async saveTicket() {
        // ... save ticket logic ...
    }
};
