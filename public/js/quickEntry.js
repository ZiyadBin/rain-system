// quickEntry.js - Enhanced with WhatsApp Parser
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

    // === CHANGED ===
    // Updated to include the parser and new passenger row layout
    renderForm() {
        const quickEntryDiv = document.getElementById('quick-entry');
        quickEntryDiv.innerHTML = `
            <div class="section">
                <h2>Quick Ticket Entry</h2>
                
                <div class="quick-entry-layout">
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
                                <label for="boarding-station">Boarding Station (Optional)</label>
                                <input type="text" id="boarding-station" placeholder="Type station code or name...">
                                <div class="autocomplete-dropdown" id="boarding-station-dropdown"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="train-number">Train Number/Name *</label>
                                <input type="text" id="train-number" placeholder="e.g., 12218 or Chennai Mail" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="class">Class *</label>
                                <select id="class" required>
                                    <option value="">Select Class</option>
                                    <optgroup label="AC Classes">
                                        <option value="1A">First AC (1A)</option>
                                        <option value="2A">AC 2 Tier (2A)</option>
                                        <option value="3A">AC 3 Tier (3A)</option>
                                        <option value="CC">AC Chair Car (CC)</option>
                                        <option value="EC">Executive Chair Car (EC)</option>
                                    </optgroup>
                                    <optgroup label="Non-AC Classes">
                                        <option value="SL">Sleeper (SL)</option>
                                        <option value="2S">Second Seating (2S)</option>
                                    </optgroup>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="journey-date">Journey Date *</label>
                                <input type="date" id="journey-date" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Passengers</label>
                            <div style="font-size: 13px; color: #666; margin-bottom: 12px; font-style: italic;">
                                📱 Mobile number (10 digits) only required for first passenger
                            </div>
                            <div id="passengers-list">
                                <div class="passenger-row">
                                    <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
                                    <input type="tel" placeholder="Mobile * (10 digits)" class="passenger-mobile" 
                                           maxlength="10" pattern="[0-9]{10}" required>
                                    <input type="number" placeholder="Age" class="passenger-age" min="1" max="100">
                                    <select class="passenger-gender">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button onclick="quickEntry.addPassenger()" style="background: #6c757d;">+ Add Companion</button>
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

                    <div class="side-panel">
                        
                        <div class="parser-section">
                            <h3>Smart Paste</h3>
                            <textarea id="qe-parser-input" rows="8" placeholder="Paste customer details here..."></textarea>
                            <button onclick="quickEntry.parseText()" style="width: 100%; margin: 10px 0 0 0;">
                                ⚡ Parse & Fill Form
                            </button>
                        </div>
                        
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

        // Initialize autocomplete for all station fields
        this.initAutocomplete('from-station', 'from-station-dropdown');
        this.initAutocomplete('to-station', 'to-station-dropdown');
        this.initAutocomplete('boarding-station', 'boarding-station-dropdown');
    },

    // ... (initAutocomplete function is unchanged)
    initAutocomplete(inputId, dropdownId) {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);

        input.addEventListener('input', (e) => {
            if (e.target.value) {
                e.target.value = e.target.value.toUpperCase();
            }
            
            const query = e.target.value.trim();
            dropdown.innerHTML = '';
            
            if (query.length < 1) {
                dropdown.style.display = 'none';
                return;
            }

            const matches = this.stations.filter(station => 
                station.code.includes(query) || 
                station.name.toUpperCase().includes(query)
            ).slice(0, 8);

            if (matches.length > 0) {
                matches.forEach(station => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.innerHTML = `<strong>${station.code}</strong> - ${station.name}`;
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

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    // ... (loadLatestTickets and renderLatestTickets functions are unchanged)
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
                    <div class="ticket-train">
                        ${ticket.train_number || 'No train'}
                    </div>
                    <div class="ticket-status ${ticket.status}">
                        ${ticket.status}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // === CHANGED ===
    // Updated passenger age max to 100
    addPassenger() {
        const passengersList = document.getElementById('passengers-list');
        const newRow = document.createElement('div');
        newRow.className = 'passenger-row';
        newRow.innerHTML = `
            <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
            <input type="number" placeholder="Age" class="passenger-age" min="1" max="100">
            <select class="passenger-gender">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
        `;
        passengersList.appendChild(newRow);
    },

    // ... (setDefaultDate function is unchanged)
    setDefaultDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('journey-date').value = tomorrow.toISOString().split('T')[0];
    },

    // === CHANGED ===
    // Updated to match new passenger row layout and age limit
    resetForm() {
        if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
            document.getElementById('from-station').value = '';
            document.getElementById('to-station').value = '';
            document.getElementById('boarding-station').value = '';
            document.getElementById('train-number').value = '';
            document.getElementById('class').value = '';
            document.getElementById('remark').value = '';
            document.getElementById('qe-parser-input').value = '';
            
            this.setDefaultDate();
            
            const passengersList = document.getElementById('passengers-list');
            passengersList.innerHTML = `
                <div class="passenger-row">
                    <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
                    <input type="tel" placeholder="Mobile * (10 digits)" class="passenger-mobile" 
                           maxlength="10" pattern="[0-9]{10}" required>
                    <input type="number" placeholder="Age" class="passenger-age" min="1" max="100">
                    <select class="passenger-gender">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            `;
            
            app.showMessage('Form reset successfully', 'success');
        }
    },

    // ... (saveTicket function is unchanged, but new parser logic below)
    async saveTicket() {
        try {
            const fromStationInput = document.getElementById('from-station');
            const toStationInput = document.getElementById('to-station');
            const trainNumberInput = document.getElementById('train-number');
            const classInput = document.getElementById('class');
            const journeyDateInput = document.getElementById('journey-date');
            const boardingStationInput = document.getElementById('boarding-station');
            
            const fromStation = fromStationInput.value.trim().toUpperCase();
            const toStation = toStationInput.value.trim().toUpperCase();
            const trainNumber = trainNumberInput.value.trim();
            const journeyClass = classInput.value;
            const journeyDate = journeyDateInput.value;
            const boardingStation = boardingStationInput.value.trim().toUpperCase();
            
            if (!fromStation || !toStation || !trainNumber || !journeyClass || !journeyDate) {
                app.showMessage('❌ Please fill all required fields', 'error');
                return;
            }

            console.log('📍 Station codes:', { fromStation, toStation, boardingStation });

            const passengerRows = document.querySelectorAll('.passenger-row');
            const passengers = [];
            
            for (let i = 0; i < passengerRows.length; i++) {
                const row = passengerRows[i];
                const nameInput = row.querySelector('.passenger-name');
                const ageInput = row.querySelector('.passenger-age');
                const genderInput = row.querySelector('.passenger-gender');
                
                const name = nameInput.value.trim();
                
                if (name) {
                    const passenger = {
                        name: name,
                        age: ageInput.value || '',
                        gender: genderInput.value || 'Male'
                    };
                    
                    // === CHANGED ===
                    // Mobile is now on the first row, find it
                    if (i === 0) {
                        const mobileInput = row.querySelector('.passenger-mobile');
                        const mobile = mobileInput ? mobileInput.value.trim() : '';
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

            const ticketData = {
                username: app.currentUser.name,
                from_station: fromStation,
                to_station: toStation,
                train_number: trainNumber,
                class: journeyClass,
                journey_date: journeyDate,
                boarding_station: boardingStation || '',
                remark: document.getElementById('remark').value.trim(),
                passengers: passengers
            };

            const response = await fetch(`${app.API_BASE}/api/tickets`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Name': app.currentUser.name
                },
                body: JSON.stringify(ticketData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                app.showMessage(`✅ Ticket saved successfully! ID: ${result.ticketId}`, 'success');
                this.resetForm(); // This will show the confirm dialog
                this.loadLatestTickets();
                
                if (document.getElementById('ac-queue').classList.contains('active')) {
                    queue.load('AC');
                }
                if (document.getElementById('non-ac-queue').classList.contains('active')) {
                    queue.load('NON_AC');
                }
            } else {
                app.showMessage('❌ Error saving ticket: ' + result.error, 'error');
            }

        } catch (error) {
            console.error('❌ Save ticket error:', error);
            app.showMessage('❌ Network error: ' + error.message, 'error');
        }
    },
    
    // === NEW PARSER FUNCTION ===
    parseText() {
        const text = document.getElementById('qe-parser-input').value;
        if (!text.trim()) {
            app.showMessage('ℹ️ Paste text into the box first', 'error');
            return;
        }

        // 1. Clear the form (without confirmation)
        document.getElementById('from-station').value = '';
        document.getElementById('to-station').value = '';
        document.getElementById('boarding-station').value = '';
        document.getElementById('train-number').value = '';
        document.getElementById('class').value = '';
        document.getElementById('remark').value = '';
        this.setDefaultDate();
        const passengersList = document.getElementById('passengers-list');
        passengersList.innerHTML = `
            <div class="passenger-row">
                <input type="text" placeholder="Passenger Name *" class="passenger-name" required>
                <input type="tel" placeholder="Mobile * (10 digits)" class="passenger-mobile" 
                       maxlength="10" pattern="[0-9]{10}" required>
                <input type="number" placeholder="Age" class="passenger-age" min="1" max="100">
                <select class="passenger-gender">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
        `;
        
        let lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let passengerLines = [];
        let primaryMobile = '';
        let defaultGender = 'Male'; // Default gender
        
        // 2. Global Hints (Gender, Class, Mobile)
        let classFound = '';
        const classRegex = /\b(1A|2A|3A|CC|EC|SL|2S)\b/i;
        const acRegex = /\b(AC)\b/i;
        const mobileRegex = /\b(\d{10})\b/;

        if (text.toUpperCase().includes('ALL FEMALE')) {
            defaultGender = 'Female';
        }
        
        const classMatch = text.match(classRegex);
        if (classMatch) {
            classFound = classMatch[1].toUpperCase();
        } else if (text.match(acRegex)) {
            classFound = '3A'; // Default to 3A if "AC" is mentioned
        } else {
            classFound = 'SL'; // Default to SL
        }
        document.getElementById('class').value = classFound;
        
        // Find and remove mobile number
        for (let i = 0; i < lines.length; i++) {
            const mobileMatch = lines[i].match(mobileRegex);
            if (mobileMatch && !primaryMobile) {
                primaryMobile = mobileMatch[1];
                lines.splice(i, 1); // Remove the line
                i--; // Adjust index
            }
        }

        // 3. First Line (Route & Train)
        const firstLine = lines.shift() || ''; // Take the first line and remove it
        let trainPart = firstLine;
        let foundStations = [];

        // Find station codes
        const allStationCodes = this.stations.map(s => s.code);
        const words = trainPart.split(/\s+/);
        words.forEach(word => {
            if (allStationCodes.includes(word.toUpperCase())) {
                foundStations.push(word.toUpperCase());
                // Remove station code from train part (tricky, do it by replacing)
                trainPart = trainPart.replace(new RegExp(`\\b${word}\\b`, 'i'), '');
            }
        });

        if (foundStations.length === 3) {
            document.getElementById('from-station').value = foundStations[0];
            document.getElementById('boarding-station').value = foundStations[1];
            document.getElementById('to-station').value = foundStations[2];
        } else if (foundStations.length === 2) {
            document.getElementById('from-station').value = foundStations[0];
            document.getElementById('to-station').value = foundStations[1];
        }
        
        // What's left is the train
        document.getElementById('train-number').value = trainPart.trim();
        
        // 4. Passengers
        passengerLines = lines; // What's left are passenger lines
        const firstPassengerRow = passengersList.querySelector('.passenger-row');

        for (let i = 0; i < passengerLines.length; i++) {
            let line = passengerLines[i];
            
            let gender = defaultGender;
            let age = '';
            let name = '';

            // Parse Right-to-Left
            // Find Gender
            const genderMatch = line.match(/\b([MF])\b$/i);
            if (genderMatch) {
                gender = genderMatch[1].toUpperCase() === 'M' ? 'Male' : 'Female';
                line = line.replace(/\b([MF])\b$/i, '').trim();
            }

            // Find Age
            const ageMatch = line.match(/\b(\d{1,3})\b$/);
            if (ageMatch) {
                age = ageMatch[1];
                line = line.replace(/\b(\d{1,3})\b$/, '').trim();
            }
            
            // What's left is the name
            name = line.trim();

            if (!name) continue; // Skip empty lines or lines with only age/gender

            // Get the row to fill
            let currentRow;
            if (i === 0) {
                currentRow = firstPassengerRow;
            } else {
                this.addPassenger(); // Add a new row
                currentRow = passengersList.lastChild; // Get that new row
            }
            
            // Fill the row
            currentRow.querySelector('.passenger-name').value = name;
            currentRow.querySelector('.passenger-age').value = age;
            currentRow.querySelector('.passenger-gender').value = gender;
            
            if (i === 0) {
                currentRow.querySelector('.passenger-mobile').value = primaryMobile;
            }
        }
        
        app.showMessage('✅ Form has been auto-filled. Please review.', 'success');
    }
};
