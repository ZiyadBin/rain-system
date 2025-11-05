const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/', ticketController.saveTicket);
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicket);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
