const express = require('express');
const router = express.Router();

// Mock database (in-memory storage for testing)
let mockTickets = [
    {
        id: 'TKT1701234567',
        from_station: 'Tirur',
        to_station: 'Chennai',
        passengers: 'John Doe (25/Male), Jane Doe (30/Female)',
        status: 'received',
        created: new Date().toISOString(),
        class: 'Sleeper',
        journey_date: '2024-01-15',
        mobile: '9876543210',
        train_type: 'Express',
        remark: 'Window seat preferred',
        created_by: 'Ziyad'
    }
];

// Save ticket (mock version)
router.post('/', async (req, res) => {
    try {
        const ticketData = req.body;
        
        // Generate ticket ID
        const ticketId = 'TKT' + Date.now();
        
        // Format passengers with age and gender
        const passengerDetails = ticketData.passengers.map(p => 
            `${p.name}${p.age ? ` (${p.age}` : ''}${p.gender ? `/${p.gender}` : ''}${p.age ? ')' : ''}`
        ).join(', ');
        
        const primaryMobile = ticketData.passengers[0]?.mobile || 'N/A';
        
        // Create mock ticket
        const newTicket = {
            id: ticketId,
            from_station: ticketData.from_station,
            to_station: ticketData.to_station,
            passengers: passengerDetails,
            status: 'received',
            created: new Date().toISOString(),
            class: ticketData.class,
            journey_date: ticketData.journey_date,
            mobile: primaryMobile,
            train_type: ticketData.train_type || '',
            remark: ticketData.remark || '',
            created_by: ticketData.username
        };

        // Add to mock database
        mockTickets.push(newTicket);

        console.log('✅ Ticket saved:', newTicket);

        res.json({ 
            success: true, 
            ticketId: ticketId,
            message: 'Ticket saved successfully'
        });

    } catch (error) {
        console.error('Error saving ticket:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get tickets with filter option
router.get('/', async (req, res) => {
    try {
        const { filter } = req.query;
        let filteredTickets = [...mockTickets];

        // Apply filters
        if (filter === 'MY' && req.headers['user-name']) {
            filteredTickets = mockTickets.filter(ticket => 
                ticket.created_by === req.headers['user-name']
            );
        } else if (filter && filter !== 'ALL') {
            filteredTickets = mockTickets.filter(ticket => 
                ticket.created_by === filter
            );
        }

        // Return tickets sorted by creation date (newest first)
        const sortedTickets = filteredTickets.sort((a, b) => 
            new Date(b.created) - new Date(a.created)
        );

        res.json(sortedTickets);

    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get ticket by ID
router.get('/:id', async (req, res) => {
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
});

// Update ticket
router.put('/:id', async (req, res) => {
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
});

// Delete ticket
router.delete('/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticketIndex = mockTickets.findIndex(t => t.id === ticketId);
        
        if (ticketIndex !== -1) {
            mockTickets.splice(ticketIndex, 1);
            res.json({ success: true, message: 'Ticket deleted successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Ticket not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
