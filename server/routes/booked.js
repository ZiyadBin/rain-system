const express = require('express');
const router = express.Router();
const bookedController = require('../controllers/bookedController');

// Get all booked tickets
router.get('/', bookedController.getBookedTickets);

// Add booked ticket
router.post('/', bookedController.addBookedTicket);

// Update booked ticket
router.put('/:id', bookedController.updateBookedTicket);

// Export booked tickets as CSV
router.get('/export', bookedController.exportBookedTickets);

module.exports = router;
