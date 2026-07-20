const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cấu hình Cloudinary (Cloudinary tự động lấy cấu hình từ biến môi trường CLOUDINARY_URL)
// Nếu chưa có biến môi trường CLOUDINARY_URL, nó sẽ throw lỗi hoặc upload thất bại.

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'haven-store', // Tên thư mục trên Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }] // Tự động resize ảnh nếu quá lớn
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Trả về đường link ảnh public từ Cloudinary
        const fileUrl = req.file.path;
        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

module.exports = router;

