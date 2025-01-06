const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create a schema for tracking user activity
const visitorSchema = new mongoose.Schema({
    ip: String,
    device: String,
    browser: String,
    visitDate: { type: Date, default: Date.now },
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// Endpoint to log user visits
router.post('/track', async (req, res) => {
    try {
        const { ip, device, browser } = req.body;
        await Visitor.create({ ip, device, browser });
        res.status(200).send({ message: 'Visit logged successfully' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to log visit' });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const { year } = req.query; // Get the year from query parameters
        const selectedYear = parseInt(year) || new Date().getFullYear(); // Default to current year if no year is provided

        // Find visitors for the selected year
        const visitors = await Visitor.find({
            visitDate: {
                $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
                $lt: new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`)
            }
        });

        const totalVisits = visitors.length;

        // Initialize array for 12 months (January to December)
        const monthlyVisitors = Array(12).fill(0);

        visitors.forEach((visitor) => {
            if (visitor.visitDate) {
                const month = new Date(visitor.visitDate).getMonth(); // Extract month (0-11)
                monthlyVisitors[month]++;
            }
        });

        // Devices count (no change needed here)
        const devices = visitors.reduce((acc, visitor) => {
            acc[visitor.device] = (acc[visitor.device] || 0) + 1;
            return acc;
        }, {});

        // Browsers count with 'Unknown' replaced by 'Other'
        const browsers = visitors.reduce((acc, visitor) => {
            const browser = visitor.browser || 'Unknown'; // Default to 'Unknown' if no browser data exists
            acc[browser === 'Unknown' ? 'Other' : browser] = (acc[browser === 'Unknown' ? 'Other' : browser] || 0) + 1;
            return acc;
        }, {});

        res.status(200).send({ totalVisits, devices, browsers, monthlyVisitors });
    } catch (error) {
        console.error('Error in /api/analytics:', error);
        res.status(500).send({ error: 'Failed to fetch analytics' });
    }
});




module.exports = router;
