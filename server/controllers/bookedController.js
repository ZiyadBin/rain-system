const db = require('../database/db');

const bookedController = {
    // Get all booked tickets
    async getBookedTickets(req, res) {
        try {
            const { period, staff } = req.query;
            let bookedTickets = db.read('booked_tickets');

            // Filter by period if specified
            if (period && period !== 'ALL') {
                const now = new Date();
                let startDate;

                switch (period) {
                    case 'TODAY':
                        startDate = new Date(now.setHours(0, 0, 0, 0));
                        break;
                    case 'WEEK':
                        startDate = new Date(now.setDate(now.getDate() - 7));
                        break;
                    case 'MONTH':
                        startDate = new Date(now.setMonth(now.getMonth() - 1));
                        break;
                }

                if (startDate) {
                    bookedTickets = bookedTickets.filter(ticket => 
                        new Date(ticket.booked_date) >= startDate
                    );
                }
            }

            // Filter by staff if specified
            if (staff && staff !== 'ALL') {
                bookedTickets = bookedTickets.filter(ticket => 
                    ticket.staff === staff
                );
            }

            // Sort by booked date (newest first)
            const sortedTickets = bookedTickets.sort((a, b) => 
                new Date(b.booked_date) - new Date(a.booked_date)
            );

            res.json({
                success: true,
                data: sortedTickets
            });

        } catch (error) {
            console.error('Error getting booked tickets:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    // Add booked ticket (when marking as booked from queue)
    async addBookedTicket(req, res) {
        try {
            const { ticketId, pnr } = req.body;

            if (!ticketId || !pnr) {
                return res.status(400).json({
                    success: false,
                    error: 'Ticket ID and PNR are required'
                });
            }

            // Get the original ticket
            const tickets = db.read('tickets');
            const ticket = tickets.find(t => t.id === ticketId);

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    error: 'Original ticket not found'
                });
            }

            // Create booked ticket record
            const bookedTicket = {
                id: 'BKT' + Date.now(),
                original_ticket_id: ticketId,
                pnr: pnr,
                from: ticket.from_station,
                to: ticket.to_station,
                name: ticket.passengers.split(',')[0].split(' (')[0],
                mobile: ticket.mobile,
                staff: ticket.created_by,
                journey_date: ticket.journey_date,
                booked_date: new Date().toISOString(),
                class: ticket.class,
                train_number: ticket.train_number,
                remark: ticket.remark,
                status: 'booked'
            };

            // Save to booked tickets
            const success = db.add('booked_tickets', bookedTicket);

            if (success) {
                // Delete from active tickets
                db.delete('tickets', ticketId);

                res.json({
                    success: true,
                    message: 'Ticket marked as booked successfully',
                    bookedTicket: bookedTicket
                });
            } else {
                throw new Error('Failed to save booked ticket');
            }

        } catch (error) {
            console.error('Error adding booked ticket:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Update booked ticket (for editing in history)
    async updateBookedTicket(req, res) {
        try {
            const bookedId = req.params.id;
            const updates = req.body;

            const success = db.update('booked_tickets', bookedId, updates);

            if (success) {
                res.json({
                    success: true,
                    message: 'Booked ticket updated successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Booked ticket not found'
                });
            }

        } catch (error) {
            console.error('Error updating booked ticket:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Export booked tickets as CSV/Excel
    async exportBookedTickets(req, res) {
        try {
            const { startDate, endDate, staff } = req.query;
            let bookedTickets = db.read('booked_tickets');

            // Apply filters
            if (startDate) {
                bookedTickets = bookedTickets.filter(ticket => 
                    new Date(ticket.booked_date) >= new Date(startDate)
                );
            }

            if (endDate) {
                bookedTickets = bookedTickets.filter(ticket => 
                    new Date(ticket.booked_date) <= new Date(endDate)
                );
            }

            if (staff && staff !== 'ALL') {
                bookedTickets = bookedTickets.filter(ticket => 
                    ticket.staff === staff
                );
            }

            // Convert to CSV
            const headers = ['PNR', 'From', 'To', 'Passenger Name', 'Mobile', 'Staff', 'Journey Date', 'Booked Date', 'Class', 'Train Number', 'Remark'];
            const csvData = bookedTickets.map(ticket => [
                ticket.pnr,
                ticket.from,
                ticket.to,
                ticket.name,
                ticket.mobile,
                ticket.staff,
                ticket.journey_date,
                new Date(ticket.booked_date).toLocaleDateString(),
                ticket.class,
                ticket.train_number,
                ticket.remark || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');

            // Set response headers for file download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=booked_tickets_${new Date().toISOString().split('T')[0]}.csv`);
            
            res.send(csvContent);

        } catch (error) {
            console.error('Error exporting booked tickets:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = bookedController;
