const express = require('express');
const router = express.Router();

// Mock database (in-memory storage for testing)
let mockTickets = [
    {
        id: 'TKT1701234567',
        from_station: 'Tirur',
        to_station: 'Chennai',
        passengers: 'John Doe, Jane Doe',
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
        const passengerNames = ticketData.passengers.map(p => p.name).join(', ');
        const primaryMobile = ticketData.passengers[0]?.mobile || 'N/A';
        
        // Create mock ticket
        const newTicket = {
            id: ticketId,
            from_station: ticketData.from_station,
            to_station: ticketData.to_station,
            passengers: passengerNames,
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
            message: 'Ticket saved successfully (Mock Database)'
        });

    } catch (error) {
        console.error('Error saving ticket:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get all tickets (mock version)
router.get('/', async (req, res) => {
    try {
        // Return tickets sorted by creation date (newest first)
        const sortedTickets = mockTickets.sort((a, b) => 
            new Date(b.created) - new Date(a.created)
        );

        res.json(sortedTickets);

    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ error: error.message });
    }
});

// Additional endpoints for future functionality
router.patch('/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        const updates = req.body;
        
        const ticketIndex = mockTickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            mockTickets[ticketIndex] = { ...mockTickets[ticketIndex], ...updates };
            res.json({ success: true, message: 'Ticket updated' });
        } else {
            res.status(404).json({ success: false, error: 'Ticket not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
