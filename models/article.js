const mongoose = require('mongoose');

// Check if the model already exists to avoid overwriting it
const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },  // New field added

    content: { type: String, required: true },
    author: String,
    slug: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
    coverImage: { type: String, default: null }, // For image URL if relevant
});

// Use the existing model if it already exists, otherwise create a new one
const Article = mongoose.models.Article || mongoose.model('Article', articleSchema);

module.exports = Article;
