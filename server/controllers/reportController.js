// Import the mock tickets data
let mockTickets = require('./ticketController').mockTickets;

const reportController = {
    // Get comprehensive analytics
    async getAnalytics(req, res) {
        try {
            const { period = 'all' } = req.query;
            
            // Basic analytics
            const totalTickets = mockTickets.length;
            const bookedTickets = mockTickets.filter(t => t.status === 'booked').length;
            const pendingTickets = mockTickets.filter(t => t.status !== 'booked').length;
            
            // Group by user
            const userStats = {};
            mockTickets.forEach(ticket => {
                const user = ticket.created_by;
                if (!userStats[user]) {
                    userStats[user] = { 
                        total: 0, 
                        booked: 0,
                        pending: 0
                    };
                }
                userStats[user].total++;
                if (ticket.status === 'booked') {
                    userStats[user].booked++;
                } else {
                    userStats[user].pending++;
                }
            });

            // Route statistics
            const routeStats = {};
            mockTickets.forEach(ticket => {
                const route = `${ticket.from_station} → ${ticket.to_station}`;
                if (!routeStats[route]) {
                    routeStats[route] = { count: 0, booked: 0 };
                }
                routeStats[route].count++;
                if (ticket.status === 'booked') {
                    routeStats[route].booked++;
                }
            });

            // Class distribution
            const classStats = {};
            mockTickets.forEach(ticket => {
                const ticketClass = ticket.class;
                if (!classStats[ticketClass]) {
                    classStats[ticketClass] = 0;
                }
                classStats[ticketClass]++;
            });

            res.json({
                success: true,
                data: {
                    summary: {
                        total: totalTickets,
                        booked: bookedTickets,
                        pending: pendingTickets,
                        completionRate: totalTickets > 0 ? ((bookedTickets / totalTickets) * 100).toFixed(1) : 0
                    },
                    userPerformance: userStats,
                    routeAnalysis: routeStats,
                    classDistribution: classStats,
                    recentActivity: mockTickets.slice(0, 10) // Last 10 tickets
                }
            });

        } catch (error) {
            console.error('Error generating analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get basic statistics
    async getStats(req, res) {
        try {
            const totalTickets = mockTickets.length;
            const bookedTickets = mockTickets.filter(t => t.status === 'booked').length;
            const today = new Date().toISOString().split('T')[0];
            const todayTickets = mockTickets.filter(t => 
                t.created.split('T')[0] === today
            ).length;

            // Top routes
            const routeCounts = {};
            mockTickets.forEach(ticket => {
                const route = `${ticket.from_station} → ${ticket.to_station}`;
                routeCounts[route] = (routeCounts[route] || 0) + 1;
            });

            const topRoutes = Object.entries(routeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([route, count]) => ({ route, count }));

            res.json({
                success: true,
                data: {
                    totalTickets,
                    bookedTickets,
                    todayTickets,
                    pendingTickets: totalTickets - bookedTickets,
                    completionRate: totalTickets > 0 ? ((bookedTickets / totalTickets) * 100).toFixed(1) : 0,
                    topRoutes
                }
            });

        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = reportController;
