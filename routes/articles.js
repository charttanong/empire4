const express = require('express');
const multer = require('multer');
const path = require('path');
const Article = require('../models/article'); // Ensure this path is correct
const router = express.Router();


app.use(express.json({ limit: '50mb' }));  // Increase limit to 50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase limit for form data

// Set up multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Save the images to the "public/uploads" directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename for the image
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Max size 10MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed.'));
        }
    }
});

router.post('/articles', upload.single('coverImage'), async (req, res) => {
    try {
        console.log('Request Body:', req.body);  // Log to check if description is present
        const { title, description, content, author } = req.body;

        const date = new Date();  // Adding current date for the article

        const coverImage = req.file ? `/uploads/${req.file.filename}` : null;

        const article = new Article({
            title,
            description,
            content,
            author,
            date,
            coverImage,
        });

        await article.save();
        res.status(201).json(article); // Return the created article
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating article', details: error.message });
    }
});


// Get all articles
router.get('/articles', async (req, res) => {
    try {
        const articles = await Article.find();
        res.json(articles); // Return all articles
    } catch (error) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});

// Get article by slug (optional, if you want to fetch a specific article)
router.get('/articles/:slug', async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug });
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching article', details: error.message });
    }
});

// PUT request to update article by slug
router.put('/api/articles/slug/:slug', async (req, res) => {
    console.log('Received PUT request:', req.params.slug);
    const { slug } = req.params;
    const { title, author, content } = req.body;

    try {
        const article = await Article.findOneAndUpdate(
            { slug },
            { title, author, content },
            { new: true }
        );

        if (!article) {
            console.log('Article not found');
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

module.exports = router;
