const express = require('express');
const multer = require('multer');
const { authenticateUser } = require('../middleware/auth');
const imageProcessor = require('../services/imageProcessor');
const storageService = require('../services/storage');
const { queueImageProcessing } = require('../services/queue');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Invalid file type'), true);
  }
});

/**
 * POST /api/images
 */
router.post(

  '/',
  authenticateUser,
  upload.array('images', 10),
  async (req, res) => {
    if (!req.files?.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.user.id;
    const results = [];

    for (const file of req.files) {
      let imageId, originalPath, thumbnailPath;

      try {
        // 1. Validate
        const validation = await imageProcessor.validateImage(file.buffer);
        if (!validation.valid) throw new Error(validation.error);

        // 2. Filenames
        const name = imageProcessor.generateUniqueFilename(file.originalname);
        const thumb = `thumb_${name}`;

        // 3. Process
        const optimized = await imageProcessor.optimizeImage(file.buffer);
        const thumbnail = await imageProcessor.generateThumbnail(file.buffer);

        // 4. Upload original
        const o = await storageService.uploadFile(optimized, name, userId, file.mimetype);
        if (!o.success) throw new Error('Original upload failed');
        originalPath = o.path;

        // 5. Upload thumb
        const t = await storageService.uploadFile(thumbnail, thumb, userId, 'image/jpeg');
        if (!t.success) throw new Error('Thumbnail upload failed');
        thumbnailPath = t.path;

        // 6. Image row
        const { data, error } = await supabaseAdmin
          .from('images')
          .insert({
            user_id: userId,
            filename: file.originalname,
            original_path: originalPath,
            thumbnail_path: thumbnailPath
          })
          .select()
          .single();

        if (error) throw error;
        imageId = data.id;

        // 7. Metadata row (REQUIRED)
        const { error: metaErr } = await supabaseAdmin
          .from('image_metadata')
          .insert({
            image_id: imageId,
            user_id: userId,
            ai_processing_status: 'pending'
          });

        if (metaErr) throw metaErr;

        // 8. Queue AI
       const signedUrl = await storageService.getSignedUrl(originalPath);

await queueImageProcessing({
  imageId,
  imageUrl: signedUrl
});


        results.push({ filename: file.originalname, success: true, imageId });

      } catch (err) {
        console.error('Upload failed:', err.message);

        if (imageId) {
          await supabaseAdmin.from('image_metadata').delete().eq('image_id', imageId);
          await supabaseAdmin.from('images').delete().eq('id', imageId);
        }
        if (originalPath) await storageService.deleteFile(originalPath);
        if (thumbnailPath) await storageService.deleteFile(thumbnailPath);

        results.push({ filename: file.originalname, success: false, error: err.message });
      }
    }

    res.json({ success: results.some(r => r.success), results });
  }
);

module.exports = router;
