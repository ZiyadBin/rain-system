const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Get all tickets with filtering
router.get('/', ticketController.getTickets);

// === NEW ROUTE ===
// Get only duplicate-flagged tickets
router.get('/duplicates', ticketController.getDuplicateTickets);
// === END NEW ROUTE ===

// Get single ticket by ID
router.get('/:id', ticketController.getTicketById);

// Create new ticket
router.post('/', ticketController.createTicket);

// Update ticket
router.put('/:id', ticketController.updateTicket);

// Delete ticket
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
