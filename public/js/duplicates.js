const db = require('../database/db');

// === CHANGED ===
// Updated the duplicate-checking logic
function findDuplicates(newTicket) {
    const allTickets = db.read('tickets');
    const allBooked = db.read('booked_tickets');

    // Check 1: Mobile Number + Route (Your new logic)
    let mobileRouteMatch = allTickets.find(t => 
        t.mobile === newTicket.mobile &&
        t.from_station === newTicket.from_station &&
        t.to_station === newTicket.to_station
    );
    if (mobileRouteMatch) {
        return { isDuplicate: true, matchType: 'Mobile + Route (Pending)', matchId: mobileRouteMatch.id };
    }
    
    // Check booked history (remembering different field names 'from'/'to')
    mobileRouteMatch = allBooked.find(b => 
        b.mobile === newTicket.mobile &&
        b.from === newTicket.from_station &&
        b.to === newTicket.to_station
    );
    if (mobileRouteMatch) {
        return { isDuplicate: true, matchType: 'Mobile + Route (Booked)', matchId: mobileRouteMatch.id };
    }
    // === END CHANGE ===


    // Check 2: Name + Route + Date (This is the original fallback check)
    const newName = newTicket.passengers.split(',')[0].split(' (')[0].toLowerCase();
    
    let detailsMatch = allTickets.find(t => 
        t.from_station === newTicket.from_station &&
        t.to_station === newTicket.to_station &&
        t.journey_date === newTicket.journey_date &&
        t.passengers.split(',')[0].split(' (')[0].toLowerCase() === newName
    );
    if (detailsMatch) {
        return { isDuplicate: true, matchType: 'Details (Pending)', matchId: detailsMatch.id };
    }

    detailsMatch = allBooked.find(b => 
        b.from === newTicket.from_station &&
        b.to === newTicket.to_station &&
        b.journey_date === newTicket.journey_date &&
        b.name.toLowerCase() === newName
    );
    if (detailsMatch) {
        return { isDuplicate: true, matchType: 'Details (Booked)', matchId: detailsMatch.id };
    }

    return { isDuplicate: false };
}


const ticketController = {
    // Get all tickets with filtering
    async getTickets(req, res) {
        try {
            const { filter, type } = req.query;
            let tickets = db.read('tickets');

            console.log('🔍 Filtering tickets:', { filter, type, totalTickets: tickets.length });

            if (type === 'AC') {
                tickets = tickets.filter(t => ['1A', '2A', '3A', 'CC', 'EC'].includes(t.class));
            } else if (type === 'NON_AC') {
                tickets = tickets.filter(t => ['SL', '2S'].includes(t.class));
            }

            if (filter === 'MY' && req.headers['user-name']) {
                const userName = req.headers['user-name'];
                tickets = tickets.filter(t => t.created_by === userName);
            } else if (filter && filter !== 'ALL') {
                tickets = tickets.filter(t => t.created_by === filter);
            }

            // Filter *out* the duplicates from the main queue
            if (!req.query.includeDuplicates) {
                 tickets = tickets.filter(ticket => !ticket.duplicate_flag);
            }

            const sortedTickets = tickets.sort((a, b) => new Date(b.created) - new Date(a.created));
            res.json(sortedTickets);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    // Gets *only* the flagged duplicate tickets
    async getDuplicateTickets(req, res) {
        try {
            let tickets = db.read('tickets');
            let duplicateTickets = tickets.filter(ticket => ticket.duplicate_flag === true);
            const sortedTickets = duplicateTickets.sort((a, b) => 
                new Date(b.created) - new Date(a.created)
            );
            res.json(sortedTickets);
        } catch (error) {
            console.error('❌ Error getting duplicate tickets:', error);
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

    // Now checks for duplicates and adds a flag
    async createTicket(req, res) {
        try {
            const ticketData = req.body;
            const ticketId = 'TKT' + Date.now();
            
            const passengerDetails = ticketData.passengers.map(p => 
                `${p.name}${p.age ? ` (${p.age}` : ''}${p.gender ? `/${p.gender}` : ''}${p.age ? ')' : ''}`
            ).join(', ');
            
            const primaryMobile = ticketData.passengers[0]?.mobile || 'N/A';
            
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
                created_by: ticketData.username,
                duplicate_flag: false,
                duplicate_details: {}
            };
            
            // === NEW DUPLICATE CHECK (uses the updated function) ===
            const duplicateCheck = findDuplicates(newTicket);
            if (duplicateCheck.isDuplicate) {
                newTicket.duplicate_flag = true;
                newTicket.duplicate_details = {
                    matchType: duplicateCheck.matchType,
                    matchId: duplicateCheck.matchId
                };
                console.warn(`⚠️ Flagging ticket ${ticketId} as duplicate of ${duplicateCheck.matchId}`);
            }
            // === END DUPLICATE CHECK ===

            const success = db.add('tickets', newTicket);

            if (success) {
                res.json({ 
                    success: true, 
                    ticketId: ticketId,
                    isDuplicate: newTicket.duplicate_flag, // Send flag to frontend
                    message: 'Ticket saved successfully'
                });
            } else {
                throw new Error('Failed to save ticket to database');
            }

        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // (updateTicket is unchanged)
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

    // (deleteTicket is unchanged)
    async deleteTicket(req, res) {
        try {
            const ticketId = req.params.id;
            const success = db.delete('tickets', ticketId);
            if (success) {
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
