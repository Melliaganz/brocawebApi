const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'articles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    // On retire le public_id manuel pour laisser Cloudinary générer un ID unique sécurisé
    // Cela évite les erreurs de signature ("Invalid Signature")
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] 
  },
});
console.log("Cloudinary Config Name:", cloudinary.config().cloud_name);
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
