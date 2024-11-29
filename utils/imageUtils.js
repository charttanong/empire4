const fs = require('fs');
const path = require('path');

async function replaceBase64Images(content, uploadFunction) {
    const base64Regex = /data:image\/(jpeg|png|gif|webp);base64,([^\s]+)/g;
    let match;

    while ((match = base64Regex.exec(content)) !== null) {
        const base64Data = match[0];
        const extension = match[1];
        const buffer = Buffer.from(base64Data.split(',')[1], 'base64');

        // Upload the image buffer to the server
        const imageUrl = await uploadFunction(buffer, extension);

        // Replace the Base64 data with the image URL
        content = content.replace(base64Data, imageUrl);
    }

    return content;
}

// The upload function that saves the image and returns the URL
async function uploadImage(buffer, extension) {
    const filename = `${Date.now()}.${extension}`;
    const filepath = path.join(__dirname, '..', 'uploads', filename);  // Adjust path
    fs.writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
}

module.exports = { replaceBase64Images, uploadImage };
