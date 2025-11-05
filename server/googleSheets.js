const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const router = express.Router();

// Initialize Google Sheets
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

// Service account authentication
const initSheet = async () => {
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
    await doc.loadInfo();
};

// Initialize on startup
initSheet().catch(console.error);

// Save ticket
router.post('/', async (req, res) => {
    try {
        const ticketData = req.body;
        
        const sheet = doc.sheetsByIndex[0];
        
        // Generate ticket ID
        const ticketId = 'TKT' + Date.now();
        const passengerNames = ticketData.passengers.map(p => p.name).join(', ');
        const primaryMobile = ticketData.passengers[0]?.mobile || 'N/A';
        
        // Save to sheet
        await sheet.addRow({
            'id': ticketId,
            'from_station': ticketData.from_station,
            'to_station': ticketData.to_station,
            'passengers': passengerNames,
            'status': 'received',
            'created': new Date().toISOString(),
            'class': ticketData.class,
            'journey_date': ticketData.journey_date,
            'mobile': primaryMobile,
            'train_type': ticketData.train_type || '',
            'remark': ticketData.remark || '',
            'created_by': ticketData.username
        });

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

// Get all tickets
router.get('/', async (req, res) => {
    try {
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        
        const tickets = rows.map(row => ({
            id: row.get('id'),
            from_station: row.get('from_station'),
            to_station: row.get('to_station'),
            passengers: row.get('passengers'),
            status: row.get('status'),
            created: row.get('created'),
            class: row.get('class'),
            journey_date: row.get('journey_date'),
            mobile: row.get('mobile'),
            train_type: row.get('train_type'),
            remark: row.get('remark'),
            created_by: row.get('created_by')
        }));

        res.json(tickets);

    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
