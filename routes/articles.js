const express = require('express');
const multer = require('multer');
const path = require('path');
const Article = require('../models/article'); // Ensure this path is correct
const router = express.Router();
const upload = require('../middlewares/upload'); // Multer configuration

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



// POST request to create a new article
router.post('/', upload.single('coverImage'), async (req, res) => {
    try {
        const { title, content, description, author, slug } = req.body;

        // Construct an absolute URL for the cover image
        const coverImage = req.file 
            ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` 
            : null;

        const newArticle = new Article({
            title,
            content,
            description,
            author,
            slug,
            coverImage,
        });

        await newArticle.save();
        res.status(201).json({ 
            message: 'Article created successfully!', 
            article: newArticle // Optionally return the created article for confirmation
        });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Failed to create article.' });
    }
});



// GET request to fetch all articles
router.get('/articles', async (req, res) => {
    try {
        const articles = await Article.find()
            .select('title description author slug content coverImage createdAt'); // Select required fields
        res.json(articles); // Return articles
    } catch (error) {
        res.status(500).json({ error: 'Error fetching articles' });
    }
});

// GET request to fetch an article by slug
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
router.put('/articles/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    const { title, author, content } = req.body;

    try {
        const article = await Article.findOneAndUpdate(
            { slug },
            { title, author, content },
            { new: true }
        );

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

module.exports = router;
