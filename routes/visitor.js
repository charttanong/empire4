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
        const visitors = await Visitor.find();
        const totalVisits = visitors.length;
        const devices = visitors.reduce((acc, visitor) => {
            acc[visitor.device] = (acc[visitor.device] || 0) + 1;
            return acc;
        }, {});
        const browsers = visitors.reduce((acc, visitor) => {
            acc[visitor.browser] = (acc[visitor.browser] || 0) + 1;
            return acc;
        }, {});

        res.status(200).send({ totalVisits, devices, browsers });
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch analytics' });
    }
});


module.exports = router;
