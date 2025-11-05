// quickEntry.js - Enhanced with station autocomplete and WhatsApp parser
const quickEntry = {
    stations: [],
    latestTickets: [],

    async load() {
        await this.loadStations();
        this.renderForm();
        this.setDefaultDate();
        this.loadLatestTickets();
    },

    async loadStations() {
        try {
            const response = await fetch('data/stations.json');
            this.stations = await response.json();
            console.log('✅ Loaded stations:', this.stations.length);
        } catch (error) {
            console.error('❌ Error loading stations:', error);
        }
    },

    renderForm() {
        const quickEntryDiv = document.getElementById('quick-entry');
        quickEntryDiv.innerHTML = `
            <div class="section">
                <h2>Quick Ticket Entry</h2>
                
                <div class="quick-entry-layout">
                    <!-- Left Side - Main Form -->
                    <div class="form-container">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="from-station">From Station *</label>
                                <input type="text" id="from-station" placeholder="Type station code or name..." required>
                                <div class="autocomplete-dropdown" id="from-station-dropdown"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="to-station">To Station *</label>
                                <input type="text" id="to-station" placeholder="Type station code or name..." required>
                                <div class="autocomplete-dropdown" id="to-station-dropdown"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="class">Class *</label>
                                <select id="class" required>
                                    <option value="">Select Class</option>
                                    <option value="2S">Second Seating (2S)</option>
                                    <option value="CC">AC Chair Car (CC)</option>
                                    <option value="EC">Executive Chair Car (EC)</option>
                                    <option value="SL">Sleeper (SL)</option>
                                    <option value="3A">AC 3 Tier (3A)</option>
                                    <option value="2A">AC 2 Tier (2A)</option>
                                    <option value="1A">First AC (1A)</option>
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
                        
                        <div class="form-actions">
                            <button onclick="quickEntry.saveTicket()" style="background: #28a745;">💾 Save Ticket</button>
                            <button onclick="quickEntry.resetForm()" style="background: #6c757d;">🔄 Reset Form</button>
                        </div>
                    </div>

                    <!-- Right Side - WhatsApp Parser & Latest Entries -->
                    <div class="side-panel">
                        <!-- WhatsApp Parser -->
                        <div class="whatsapp-parser-section">
                            <h3>📱 WhatsApp Parser</h3>
                            <div class="parser-info">
                                <strong>Format to paste:</strong><br>
                                FROM TO TrainType<br>
                                Class<br>
                                NAME AGE GENDER<br>
                                Mobile Number
                            </div>
                            <textarea 
                                id="whatsapp-input" 
                                placeholder="Paste WhatsApp message here...
Example:
CSTM KYN Express
SL
John 25 Male
9876543210"
                                rows="8"
                            ></textarea>
                            <button onclick="quickEntry.parseWhatsApp()" style="background: #2196F3; width: 100%; margin-top: 10px;">
                                🚀 Auto Fill from WhatsApp
                            </button>
                        </div>

                        <!-- Latest Entries -->
                        <div class="latest-entries-section">
                            <h3>📋 Latest Entries</h3>
                            <div id="latest-entries-list">
                                <p>Loading latest tickets...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize autocomplete
        this.initAutocomplete('from-station', 'from-station-dropdown');
        this.initAutocomplete('to-station', 'to-station-dropdown');
    },

    initAutocomplete(inputId, dropdownId) {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim().toUpperCase();
            dropdown.innerHTML = '';
            
            if (query.length < 2) {
                dropdown.style.display = 'none';
                return;
            }

            const matches = this.stations.filter(station => 
                station.code.includes(query) || 
                station.name.toUpperCase().includes(query)
            ).slice(0, 8); // Limit to 8 results

            if (matches.length > 0) {
                matches.forEach(station => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.innerHTML = `
                        <strong>${station.code}</strong> - ${station.name}
                    `;
                    item.addEventListener('click', () => {
                        input.value = station.code;
                        dropdown.style.display = 'none';
                    });
                    dropdown.appendChild(item);
                });
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    parseWhatsApp() {
        const input = document.getElementById('whatsapp-input').value.trim();
        if (!input) {
            app.showMessage('❌ Please paste WhatsApp message first', 'error');
            return;
        }

        try {
            const lines = input.split('\n').filter(line => line.trim());
            
            if (lines.length < 3) {
                throw new Error('Invalid format. Need at least 3 lines');
            }

            // Line 1: FROM TO TrainType
            const firstLine = lines[0].split(' ');
            if (firstLine.length < 2) {
                throw new Error('First line should be: FROM TO TrainType');
            }

            const fromStation = firstLine[0].toUpperCase();
            const toStation = firstLine[1].toUpperCase();
            const trainType = firstLine.slice(2).join(' ') || '';

            // Validate stations
            const fromStationData = this.stations.find(s => s.code === fromStation);
            const toStationData = this.stations.find(s => s.code === toStation);

            if (!fromStationData) {
                throw new Error(`Invalid FROM station code: ${fromStation}`);
            }
            if (!toStationData) {
                throw new Error(`Invalid TO station code: ${toStation}`);
            }

            // Line 2: Class
            const ticketClass = lines[1].trim();

            // Line 3: Passenger details
            const passengerLine = lines[2].split(' ');
            if (passengerLine.length < 2) {
                throw new Error('Passenger line should be: NAME AGE GENDER');
            }

            const passengerName = passengerLine[0];
            const passengerAge = passengerLine[1];
            let passengerGender = passengerLine[2] || 'Male'; // Default to Male

            // Line 4: Mobile number
            const mobileLine = lines[3] ? lines[3].trim() : '';
            const mobileNumber = mobileLine.replace(/\D/g, ''); // Remove non-digits

            // Fill the form
            document.getElementById('from-station').value = fromStation;
            document.getElementById('to-station').value = toStation;
            document.getElementById('train-type').value = trainType;
            document.getElementById('class').value = ticketClass;

            // Fill passenger details
            const passengersList = document.getElementById('passengers-list');
            passengersList.innerHTML = `
                <div class="passenger-row">
                    <input type="text" placeholder="Passenger Name *" class="passenger-name" value="${passengerName}" required>
                    <input type="number" placeholder="Age" class="passenger-age" value="${passengerAge}" min="1" max="120">
                    <select class="passenger-gender">
                        <option value="Male" ${passengerGender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${passengerGender === 'Female' ? 'selected' : ''}>Female</option>
                    </select>
                    <input type="tel" placeholder="Mobile * (10 digits)" class="passenger-mobile" 
                           value="${mobileNumber}" maxlength="10" pattern="[0-9]{10}" required>
                </div>
            `;

            app.showMessage('✅ Form filled automatically from WhatsApp!', 'success');

        } catch (error) {
            app.showMessage(`❌ Parse Error: ${error.message}`, 'error');
        }
    },

    async loadLatestTickets() {
        try {
            const response = await fetch(`${app.API_BASE}/api/tickets?filter=MY&limit=5`, {
                headers: { 'User-Name': app.currentUser.name }
            });
            this.latestTickets = await response.json();
            this.renderLatestTickets();
        } catch (error) {
            console.error('Error loading latest tickets:', error);
        }
    },

    renderLatestTickets() {
        const container = document.getElementById('latest-entries-list');
        
        if (!this.latestTickets || this.latestTickets.length === 0) {
            container.innerHTML = '<p>No recent tickets</p>';
            return;
        }

        let html = '';
        this.latestTickets.forEach(ticket => {
            const journeyDate = new Date(ticket.journey_date).toLocaleDateString();
            const firstPassenger = ticket.passengers.split(',')[0].split(' (')[0];
            
            html += `
                <div class="latest-ticket-item">
                    <div class="ticket-route">
                        <strong>${ticket.from_station} → ${ticket.to_station}</strong>
                    </div>
                    <div class="ticket-details">
                        <span>${firstPassenger}</span>
                        <span>${ticket.class} • ${journeyDate}</span>
                    </div>
                    <div class="ticket-status ${ticket.status}">
                        ${ticket.status}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    addPassenger() {
        const passengersList = document.getElementById('passengers-list');
        const newRow = document.createElement('div');
        newRow.className = 'passenger-row';
        newRow.innerHTML = `
            <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
            <input type="number" placeholder="Age" class="passenger-age" min="1" max="120">
            <select class="passenger-gender">
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
        document.getElementById('whatsapp-input').value = '';
        
        // Set tomorrow's date
        this.setDefaultDate();
        
        // Reset passengers
        const passengersList = document.getElementById('passengers-list');
        passengersList.innerHTML = `
            <div class="passenger-row">
                <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
                <input type="number" placeholder="Age" class="passenger-age" min="1" max="120">
                <select class="passenger-gender">
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

            // Validate station codes
            const fromStationData = this.stations.find(s => s.code === fromStation);
            const toStationData = this.stations.find(s => s.code === toStation);

            if (!fromStationData) {
                app.showMessage(`❌ Invalid FROM station code: ${fromStation}`, 'error');
                return;
            }
            if (!toStationData) {
                app.showMessage(`❌ Invalid TO station code: ${toStation}`, 'error');
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
                        gender: row.querySelector('.passenger-gender').value || 'Male'
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
                app.showMessage(`✅ Ticket saved successfully! Ticket ID: ${result.ticketId}`, 'success');
                this.resetForm();
                this.loadLatestTickets(); // Refresh latest entries
            } else {
                app.showMessage('❌ Error saving ticket: ' + result.error, 'error');
            }

        } catch (error) {
            app.showMessage('❌ Network error: ' + error.message, 'error');
        }
    }
};
