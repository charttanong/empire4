const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Staff = require('../models/Staff');

const router = express.Router();

// Define upload directory relative to project root
const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Save with original name
    }
});


const upload = multer({ storage: storage });

// Create staff member
router.post('/', upload.fields([{ name: 'profileImage' }, { name: 'lineQRCode' }]), async (req, res) => {
    try {
        const { name, thainame, position, phone, email,facebook, group } = req.body;

        // Create URLs that will work with the static file serving
        const profileImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files['profileImage'][0].filename}`;
        const lineQRCodeUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files['lineQRCode'][0].filename}`;


        const newStaff = new Staff({
            name,
            thainame,
            position,
            phone,
            email,
            facebook,

            group,
            profileImageUrl,
            lineQRCodeUrl
        });

        await newStaff.save();
        res.status(201).json({ message: 'Staff added successfully', staff: newStaff });
    } catch (error) {
        console.error('Error adding staff:', error);
        res.status(500).json({ message: 'Error adding staff', error: error.message });
    }
});

// GET - Fetch staff by group or all staff
router.get('/', async (req, res) => {
    const { group } = req.query;
    try {
        const staff = group ? await Staff.find({ group }) : await Staff.find();
        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Failed to fetch staff', error: error.message });
    }
});

// PUT - Update staff data
router.put('/:id', upload.fields([{ name: 'profileImage' }, { name: 'lineQRCode' }]), async (req, res) => {
    try {
        const { name, thainame, position, phone, email, facebook } = req.body;
        const updatedStaff = {
            name,
            thainame,
            position,
            phone,
            email,
            facebook,
            profileImageUrl: req.files['profileImage'] ? `/uploads/${req.files['profileImage'][0].originalname}` : undefined,
            lineQRCodeUrl: req.files['lineQRCode'] ? `/uploads/${req.files['lineQRCode'][0].originalname}` : undefined,
        };

        Object.keys(updatedStaff).forEach(key => updatedStaff[key] === undefined && delete updatedStaff[key]);

        const staff = await Staff.findByIdAndUpdate(req.params.id, updatedStaff, { new: true });
        if (!staff) return res.status(404).json({ message: 'Staff member not found' });

        res.json(staff);
    } catch (error) {
        console.error('Error updating staff data:', error);
        res.status(500).json({ message: 'Error updating staff data', error: error.message });
    }
});

// DELETE - Remove a staff member
router.delete('/:id', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) return res.status(404).json({ message: 'Staff member not found' });

        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting staff data:', error);
        res.status(500).json({ message: 'Error deleting staff data', error: error.message });
    }
});

module.exports = router;

