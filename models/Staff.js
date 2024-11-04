

const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    phone: { type: String, required: true },
    facebook: { type: String, required: true },

    email: { type: String, required: true },
    group: { type: String, required: true }, // Ensure the group field is present
    profileImageUrl: { type: String, required: true },
    lineQRCodeUrl: { type: String, required: true }
});

const Staff = mongoose.model('Staff', StaffSchema);

module.exports = Staff;
