// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

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
app.use(express.static(__dirname));

// Set EJS as the view engine
app.set('view engine', 'ejs');


// Use cookie-parser middleware
app.use(cookieParser());

app.get('/set-cookie', (req, res) => {
    res.cookie('username', 'JohnDoe', { maxAge: 7 * 24 * 60 * 60 * 1000 }); // Expires in 7 days
    res.send('Cookie has been set');
});


app.get('/get-cookie', (req, res) => {
    const username = req.cookies.username;
    res.send(`Username cookie value: ${username}`);
});


app.get('/delete-cookie', (req, res) => {
    res.clearCookie('username');
    res.send('Username cookie has been deleted');
});


// Important: Define uploads directory path
const uploadDir = path.join(__dirname, 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from uploads directory
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

const Email = mongoose.model('Email', emailSchema); // Correctly defined Email model

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

// Corrected delete route
app.delete('/api/emails/:email', async (req, res) => {
    const email = req.params.email;

    console.log('Attempting to delete email:', email);

    try {
        const result = await Email.deleteOne({ email: email }); // Correct reference
        console.log('Delete result:', result);
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Email not found' });
        }
        
        res.status(200).json({ message: 'Email deleted successfully' });
    } catch (error) {
        console.error('Error deleting email:', error);
        res.status(500).json({ error: 'Error deleting email' });
    }
});

// Define Article Schema and Model
const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    author: String,
    slug: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
    coverImage: { type: String, default: null }, // For image URL if relevant
});

const Article = mongoose.model('Article', articleSchema);

// Function to generate a slug from the title
function generateSlug(title) {
    return title.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric characters
}

// Image upload configuration with multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Use the dynamic upload directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Add unique timestamp to filename
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif|webp/; // Allowed image types
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
        }
    },
});



// Image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    console.log(req.headers['content-length']);  // Log request size to see if it's larger than expected
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.status(200).json({
            url: `/uploads/${req.file.filename}`,
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});


// Serve static files from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// API Routes for Articles

// Route to handle article creation (with cover image and date)
app.post('/api/articles', upload.single('coverImage'), async (req, res) => {
    const { title, description, content, author, date } = req.body;
    const slug = generateSlug(title);

    // File path of the uploaded image
    const coverImage = req.file ? '/uploads/' + req.file.filename : null;

    const newArticle = new Article({
        title,
        description,
        content,
        author,
        date,
        slug,
        coverImage, // Save image path
    });

    try {
        await newArticle.save();
        res.status(200).send({ message: 'Article published!' });
    } catch (err) {
        res.status(500).send({ error: 'Failed to publish article.' });
    }
});

app.get('/api/articles', async (req, res) => {
    const { page = 1, limit = 10, sort = 'latest' } = req.query;
    const skip = (page - 1) * limit;

    let sortOptions = {};
    if (sort === 'az') {
        sortOptions = { title: 1 }; // Sort alphabetically (A-Z)
    } else if (sort === 'latest') {
        sortOptions = { createdAt: -1 }; // Sort by latest article (most recent first)
    } else if (sort === 'first') {
        sortOptions = { createdAt: 1 }; // Sort by first article (oldest first)
    }

    try {
        const articles = await Article.find()
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sortOptions); // Apply sorting based on the chosen order

        const totalArticles = await Article.countDocuments();
        res.json({ articles, totalArticles });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ message: 'Error fetching articles.' });
    }
});


// Route to get article by slug
app.get('/api/articles/slug/:slug', async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) {
            return res.status(404).send({ message: 'Article not found' });
        }
        res.json(article);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching article' });
    }
});

app.put('/api/articles/slug/:slug', upload.single('coverImage'), async (req, res) => {
    const { slug } = req.params;
    const { title, content, author } = req.body;

    let coverImage = req.body.coverImage; // Keep the old image if not updating it.

    // Check if a new file is uploaded, and if so, replace the old image path
    if (req.file) {
        coverImage = '/uploads/' + req.file.filename; // Use new file path
    }

    try {
        const updatedArticle = await Article.findOneAndUpdate(
            { slug }, // Match by slug instead of id
            { title, content, author, coverImage },
            { new: true } // Return the updated article
        );

        if (!updatedArticle) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.status(200).json(updatedArticle);
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Delete an article by slug (fixing the DELETE route)
app.delete('/api/articles/slug/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const deletedArticle = await Article.findOneAndDelete({ slug });

        if (!deletedArticle) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete an article
app.delete('/api/articles/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedArticle = await Article.findByIdAndDelete(id);

        if (!deletedArticle) return res.status(404).json({ error: 'Article not found' });

        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


app.use((req, res, next) => {
    req.setTimeout(1000 * 60); // 1 minute timeout
    next();
});


app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File size is too large. Max allowed size is 50MB.' });
        }
    }
    if (err.status === 413) {
        return res.status(413).json({ error: 'Payload too large.' });
    }
    next(err);
});

app.get('/articles', (req, res) => {
    res.render('articles.html'); // Assuming you're using a template engine like EJS
});


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


// Serve articles.html on the article/:slug route
app.get('/article/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'articles.html')); // Ensure this is correct
});
