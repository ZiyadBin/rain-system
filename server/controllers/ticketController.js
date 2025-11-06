const db = require('../database/db');

const ticketController = {
    // Get all tickets with filtering
    async getTickets(req, res) {
        try {
            const { filter, type } = req.query;
            let tickets = db.read('tickets');

            console.log('🔍 Filtering tickets:', { filter, type, totalTickets: tickets.length });

            // Apply AC/Non-AC filter
            if (type === 'AC') {
                tickets = tickets.filter(ticket => 
                    ['1A', '2A', '3A', 'CC', 'EC'].includes(ticket.class)
                );
            } else if (type === 'NON_AC') {
                tickets = tickets.filter(ticket => 
                    ['SL', '2S'].includes(ticket.class)
                );
            }

            // Apply user filter
            if (filter === 'MY' && req.headers['user-name']) {
                const userName = req.headers['user-name'];
                tickets = tickets.filter(ticket => 
                    ticket.created_by === userName
                );
            } else if (filter && filter !== 'ALL') {
                tickets = tickets.filter(ticket => 
                    ticket.created_by === filter
                );
            }

            // Return tickets sorted by creation date (newest first)
            const sortedTickets = tickets.sort((a, b) => 
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
            const tickets = db.read('tickets');
            const ticket = tickets.find(t => t.id === ticketId);
            
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

            // Save to database
            const success = db.add('tickets', newTicket);

            if (success) {
                console.log('✅ Ticket saved to database:', newTicket);
                const tickets = db.read('tickets');
                console.log('📊 Total tickets in DB:', tickets.length);

                res.json({ 
                    success: true, 
                    ticketId: ticketId,
                    message: 'Ticket saved successfully'
                });
            } else {
                throw new Error('Failed to save ticket to database');
            }

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
            
            const success = db.update('tickets', ticketId, updates);
            
            if (success) {
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
            const success = db.delete('tickets', ticketId);
            
            if (success) {
                const tickets = db.read('tickets');
                console.log('🗑️ Ticket deleted. Remaining:', tickets.length);
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
