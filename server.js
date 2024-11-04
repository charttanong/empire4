// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const staffRoutes = require('./routes/staff');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Important: Define uploads directory path
const uploadDir = path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from uploads directory
// This line is crucial - it maps the /uploads URL path to the actual uploads directory

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// MongoDB Connection
mongoose.connect('mongodb+srv://charttanongzza:BbqsbGkvfQ9bpAbD@cluster0.2gme1.mongodb.net/staffDB?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));



// Staff schema
const staffSchema = new mongoose.Schema({
    name: String,
    position: String,
    phone: String,
    email: String,
    facebook: String,

    profileImageUrl: String,
    lineQRCodeUrl: String,
});

const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);



// API routes
app.use('/api/staff', staffRoutes);

// Define Email schema
const emailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});

const Email = mongoose.model('Email', emailSchema);

// Route to add email
app.post('/api/emails', async (req, res) => {
    try {
        const { email } = req.body;
        const newEmail = new Email({ email });
        await newEmail.save();
        res.status(201).send({ message: 'Email saved successfully' });
    } catch (error) {
        res.status(400).send({ message: 'Error saving email', error });
    }
});

// Route to get emails sorted alphabetically
app.get('/api/emails', async (req, res) => {
    try {
        const emails = await Email.find().sort({ email: 1 }).select('email -_id'); // Sort emails A-Z
        const emailList = emails.map(e => e.email);
        res.status(200).json(emailList);
    } catch (error) {
        res.status(500).send({ message: 'Error retrieving emails', error });
    }
});

// Assuming you have a route like this in your Express app
app.delete('/api/emails/:email', async (req, res) => {
    const email = req.params.email;

    // Logic to delete the email from the database
    // This will depend on how you're storing your emails, e.g., using Mongoose
    try {
        await EmailModel.deleteOne({ email: email });
        res.status(200).send({ message: 'Email deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: 'Error deleting email' });
    }
});




// Static routes
app.use(express.static(path.join(__dirname, 'public')));

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/staff-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/staff-list.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});