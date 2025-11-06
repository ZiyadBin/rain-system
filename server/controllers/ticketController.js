// Mock database (in-memory storage for testing)
let mockTickets = [
    {
        id: 'TKT1701234567',
        from_station: 'CSTM',
        to_station: 'KYN',
        train_number: '12218',
        boarding_station: '',
        passengers: 'John Doe (25/Male), Jane Doe (30/Female)',
        status: 'received',
        created: new Date().toISOString(),
        class: 'SL',
        journey_date: '2024-01-15',
        mobile: '9876543210',
        remark: 'Window seat preferred',
        created_by: 'Ziyad'
    },
    // ADD SAMPLE NON-AC TICKET
    {
        id: 'TKT1701234568',
        from_station: 'PNVL',
        to_station: 'NK',
        train_number: '12134',
        boarding_station: 'PNVL',
        passengers: 'Raj Sharma (35/Male)',
        status: 'received',
        created: new Date().toISOString(),
        class: 'SL',
        journey_date: '2024-01-16',
        mobile: '9876543211',
        remark: 'Lower berth preferred',
        created_by: 'Najad'
    },
    // ADD SAMPLE AC TICKET
    {
        id: 'TKT1701234569',
        from_station: 'CSTM',
        to_station: 'LTT',
        train_number: '22222',
        boarding_station: '',
        passengers: 'Priya Patel (28/Female)',
        status: 'received',
        created: new Date().toISOString(),
        class: '3A',
        journey_date: '2024-01-17',
        mobile: '9876543212',
        remark: '',
        created_by: 'Babu'
    }
];

const ticketController = {
    // Get all tickets with filtering by type (AC/NON_AC)
    async getTickets(req, res) {
        try {
            const { filter, type } = req.query;
            let filteredTickets = [...mockTickets];

            console.log('🔍 Filtering tickets:', { filter, type, totalTickets: mockTickets.length });

            // Apply AC/Non-AC filter - FIXED LOGIC
            if (type === 'AC') {
                filteredTickets = mockTickets.filter(ticket => 
                    ['1A', '2A', '3A', 'CC', 'EC'].includes(ticket.class)
                );
                console.log('✅ AC Tickets found:', filteredTickets.length);
            } else if (type === 'NON_AC') {
                filteredTickets = mockTickets.filter(ticket => 
                    ['SL', '2S', 'GEN'].includes(ticket.class)
                );
                console.log('✅ Non-AC Tickets found:', filteredTickets.length);
            }

            // Apply user filter
            if (filter === 'MY' && req.headers['user-name']) {
                const userName = req.headers['user-name'];
                filteredTickets = filteredTickets.filter(ticket => 
                    ticket.created_by === userName
                );
                console.log('✅ My Tickets after filter:', filteredTickets.length);
            } else if (filter && filter !== 'ALL') {
                filteredTickets = filteredTickets.filter(ticket => 
                    ticket.created_by === filter
                );
            }

            // Return tickets sorted by creation date (newest first)
            const sortedTickets = filteredTickets.sort((a, b) => 
                new Date(b.created) - new Date(a.created)
            );

            console.log('📤 Sending tickets:', sortedTickets.length);
            res.json(sortedTickets);

        } catch (error) {
            console.error('❌ Error getting tickets:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get single ticket by ID
    async getTicketById(req, res) {
        try {
            const ticketId = req.params.id;
            const ticket = mockTickets.find(t => t.id === ticketId);
            
            if (ticket) {
                res.json(ticket);
            } else {
                res.status(404).json({ error: 'Ticket not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Create new ticket
    async createTicket(req, res) {
        try {
            const ticketData = req.body;
            
            // Generate ticket ID
            const ticketId = 'TKT' + Date.now();
            
            // Format passengers with age and gender
            const passengerDetails = ticketData.passengers.map(p => 
                `${p.name}${p.age ? ` (${p.age}` : ''}${p.gender ? `/${p.gender}` : ''}${p.age ? ')' : ''}`
            ).join(', ');
            
            const primaryMobile = ticketData.passengers[0]?.mobile || 'N/A';
            
            // Create new ticket
            const newTicket = {
                id: ticketId,
                from_station: ticketData.from_station,
                to_station: ticketData.to_station,
                train_number: ticketData.train_number,
                boarding_station: ticketData.boarding_station || '',
                passengers: passengerDetails,
                status: 'received',
                created: new Date().toISOString(),
                class: ticketData.class,
                journey_date: ticketData.journey_date,
                mobile: primaryMobile,
                remark: ticketData.remark || '',
                created_by: ticketData.username
            };

            // Add to mock database
            mockTickets.push(newTicket);

            console.log('✅ Ticket saved:', newTicket);
            console.log('📊 Total tickets now:', mockTickets.length);

            res.json({ 
                success: true, 
                ticketId: ticketId,
                message: 'Ticket saved successfully'
            });

        } catch (error) {
            console.error('❌ Error saving ticket:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Update ticket
    async updateTicket(req, res) {
        try {
            const ticketId = req.params.id;
            const updates = req.body;
            
            const ticketIndex = mockTickets.findIndex(t => t.id === ticketId);
            if (ticketIndex !== -1) {
                mockTickets[ticketIndex] = { ...mockTickets[ticketIndex], ...updates };
                res.json({ success: true, message: 'Ticket updated successfully' });
            } else {
                res.status(404).json({ success: false, error: 'Ticket not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete ticket
    async deleteTicket(req, res) {
        try {
            const ticketId = req.params.id;
            const ticketIndex = mockTickets.findIndex(t => t.id === ticketId);
            
            if (ticketIndex !== -1) {
                const deletedTicket = mockTickets.splice(ticketIndex, 1)[0];
                console.log('🗑️ Ticket deleted:', deletedTicket.id);
                console.log('📊 Remaining tickets:', mockTickets.length);
                res.json({ success: true, message: 'Ticket deleted successfully' });
            } else {
                res.status(404).json({ success: false, error: 'Ticket not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ticketController;
