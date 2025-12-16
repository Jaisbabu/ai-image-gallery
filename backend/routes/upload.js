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
        await queueImageProcessing({
          imageId,
          filePath: originalPath
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


// const express = require('express');
// const multer = require('multer');
// const { authenticateUser } = require('../middleware/auth');
// const imageProcessor = require('../services/imageProcessor');
// const storageService = require('../services/storage');
// const { queueImageProcessing } = require('../services/queue');
// const { supabaseAdmin } = require('../config/supabase');

// const router = express.Router();

// /**
//  * Multer config
//  */
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
//   fileFilter: (req, file, cb) => {
//     const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
//     if (!allowed.includes(file.mimetype)) {
//       return cb(new Error('Invalid file type'));
//     }
//     cb(null, true);
//   }
// });

// /**
//  * POST /api/upload
//  */
// router.post(
//   '/',
//   authenticateUser,
//   upload.array('images', 10),
//   async (req, res) => {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: 'No files uploaded' });
//     }

//     const userId = req.user.id;
//     const results = [];

//     for (const file of req.files) {
//       let originalPath = null;
//       let thumbnailPath = null;
//       let imageId = null;

//       try {
//         // 1️⃣ Validate image
//         const validation = await imageProcessor.validateImage(file.buffer);
//         if (!validation.valid) {
//           throw new Error(validation.error);
//         }

//         // 2️⃣ Generate filenames
//         const uniqueName =
//           imageProcessor.generateUniqueFilename(file.originalname);
//         const thumbName = `thumb_${uniqueName}`;

//         // 3️⃣ Process image
//         const optimized = await imageProcessor.optimizeImage(file.buffer);
//         const thumbnail = await imageProcessor.generateThumbnail(file.buffer);

//         // 4️⃣ Upload original
//         const originalUpload = await storageService.uploadFile(
//           optimized,
//           uniqueName,
//           userId,
//           file.mimetype
//         );

//         if (!originalUpload.success) {
//           throw new Error('Original upload failed');
//         }

//         originalPath = originalUpload.path;

//         // 5️⃣ Upload thumbnail
//         const thumbUpload = await storageService.uploadFile(
//           thumbnail,
//           thumbName,
//           userId,
//           'image/jpeg'
//         );

//         if (!thumbUpload.success) {
//           throw new Error('Thumbnail upload failed');
//         }

//         thumbnailPath = thumbUpload.path;

//         // 6️⃣ Insert image row
//         const { data: imageRow, error: imageErr } = await supabaseAdmin
//           .from('images')
//           .insert({
//             user_id: userId,
//             filename: file.originalname,
//             original_path: originalPath,
//             thumbnail_path: thumbnailPath
//           })
//           .select()
//           .single();

//         if (imageErr || !imageRow) {
//           throw new Error('Failed to create image record');
//         }

//         imageId = imageRow.id;

//         // 7️⃣ Insert metadata row (MANDATORY)
//         const { error: metaErr } = await supabaseAdmin
//           .from('image_metadata')
//           .insert({
//             image_id: imageId,
//             user_id: userId,
//             ai_processing_status: 'pending'
//           });

//         if (metaErr) {
//           throw new Error('Failed to create metadata record');
//         }

//         // 8️⃣ Queue AI processing (ONLY NOW)
//         const queueResult = await queueImageProcessing({
//           imageId,
//           userId,
//           filePath: originalPath
//         });

//         if (!queueResult.success) {
//           throw new Error('Failed to queue AI processing');
//         }

//         results.push({
//           filename: file.originalname,
//           success: true,
//           imageId
//         });

//       } catch (err) {
//         console.error('Upload failed:', err.message);

//         // 🔁 CLEANUP (BEST EFFORT)
//         if (imageId) {
//           await supabaseAdmin.from('image_metadata').delete().eq('image_id', imageId);
//           await supabaseAdmin.from('images').delete().eq('id', imageId);
//         }

//         if (originalPath) {
//           await storageService.deleteFile(originalPath);
//         }

//         if (thumbnailPath) {
//           await storageService.deleteFile(thumbnailPath);
//         }

//         results.push({
//           filename: file.originalname,
//           success: false,
//           error: err.message
//         });
//       }
//     }

//     res.json({
//       success: results.some(r => r.success),
//       results
//     });
//   }
// );

// module.exports = router;



// const express = require('express');
// const multer = require('multer');
// const { authenticateUser } = require('../middleware/auth');
// const imageProcessor = require('../services/imageProcessor');
// const storageService = require('../services/storage');
// const { queueImageProcessing } = require('../services/queue');
// const { supabaseAdmin } = require('../config/supabase');

// const router = express.Router();

// // Configure multer for memory storage
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
//     }
//   }
// });

// /**
//  * POST /api/upload
//  * Upload single or multiple images
//  */
// router.post(
//   '/',
//   authenticateUser,
//   upload.array('images', 10),
//   async (req, res) => {
//     try {
//       if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ error: 'No files uploaded' });
//       }

//       const userId = req.user.id;
//       const uploadResults = [];

//       for (const file of req.files) {
//         try {
//           // Validate image
//           const validation = await imageProcessor.validateImage(file.buffer);
//           if (!validation.valid) {
//             uploadResults.push({
//               filename: file.originalname,
//               success: false,
//               error: validation.error
//             });
//             continue;
//           }

//           // Generate filenames
//           const uniqueFilename =
//             imageProcessor.generateUniqueFilename(file.originalname);
//           const thumbnailFilename = `thumb_${uniqueFilename}`;

//           // Process images
//           const optimizedBuffer =
//             await imageProcessor.optimizeImage(file.buffer);
//           const thumbnailBuffer =
//             await imageProcessor.generateThumbnail(file.buffer);

//           // Upload original
//           const originalUpload = await storageService.uploadFile(
//             optimizedBuffer,
//             uniqueFilename,
//             userId,
//             file.mimetype
//           );

//           if (!originalUpload.success) {
//             uploadResults.push({
//               filename: file.originalname,
//               success: false,
//               error: 'Failed to upload original image'
//             });
//             continue;
//           }

//           // Upload thumbnail
//           const thumbnailUpload = await storageService.uploadFile(
//             thumbnailBuffer,
//             thumbnailFilename,
//             userId,
//             'image/jpeg'
//           );

//           if (!thumbnailUpload.success) {
//             await storageService.deleteFile(originalUpload.path);
//             uploadResults.push({
//               filename: file.originalname,
//               success: false,
//               error: 'Failed to upload thumbnail'
//             });
//             continue;
//           }

//           // Insert image record
//           const { data: imageRecord, error: imageError } =
//             await supabaseAdmin
//               .from('images')
//               .insert({
//                 user_id: userId,
//                 filename: file.originalname,
//                 original_path: originalUpload.path,
//                 thumbnail_path: thumbnailUpload.path
//               })
//               .select()
//               .single();

//           if (imageError) {
//             await storageService.deleteFile(originalUpload.path);
//             await storageService.deleteFile(thumbnailUpload.path);
//             uploadResults.push({
//               filename: file.originalname,
//               success: false,
//               error: 'Database error'
//             });
//             continue;
//           }

//           // Insert metadata
//           await supabaseAdmin
//             .from('image_metadata')
//             .insert({
//               image_id: imageRecord.id,
//               user_id: userId,
//               ai_processing_status: 'pending'
//             });

//           // Queue AI processing
//           await queueImageProcessing({
//             imageId: imageRecord.id,
//             userId,
//             filePath: originalUpload.path
//           });

//           uploadResults.push({
//             filename: file.originalname,
//             success: true,
//             imageId: imageRecord.id
//           });

//         } catch (err) {
//           uploadResults.push({
//             filename: file.originalname,
//             success: false,
//             error: err.message
//           });
//         }
//       }

//       res.json({
//         success: uploadResults.some(r => r.success),
//         results: uploadResults
//       });

//     } catch (error) {
//       console.error('Upload error:', error);
//       res.status(500).json({
//         error: 'Upload failed',
//         message: error.message
//       });
//     }
//   }
// );

// module.exports = router;



// const express = require('express');
// const multer = require('multer');
// const { authenticateUser } = require('../middleware/auth');
// const imageProcessor = require('../services/imageProcessor');
// const storageService = require('../services/storage');
// const { queueImageProcessing } = require('../services/queue');
// const { supabaseAdmin } = require('../config/supabase');

// const router = express.Router();

// // Configure multer for memory storage
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
//     }
//   }
// });

// /**
//  * POST /api/images/upload
//  * Upload single or multiple images
//  */
// router.post('/upload', authenticateUser, upload.array('images', 10), async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: 'No files uploaded' });
//     }

//     const userId = req.user.id;
//     const uploadResults = [];

//     for (const file of req.files) {
//       try {
//         // Validate image
//         const validation = await imageProcessor.validateImage(file.buffer);
        
//         if (!validation.valid) {
//           uploadResults.push({
//             filename: file.originalname,
//             success: false,
//             error: validation.error
//           });
//           continue;
//         }

//         // Generate unique filename
//         const uniqueFilename = imageProcessor.generateUniqueFilename(file.originalname);
//         const thumbnailFilename = `thumb_${uniqueFilename}`;

//         // Optimize original image
//         const optimizedBuffer = await imageProcessor.optimizeImage(file.buffer);

//         // Generate thumbnail
//         const thumbnailBuffer = await imageProcessor.generateThumbnail(file.buffer);

//         // Upload original
//         const originalUpload = await storageService.uploadFile(
//           optimizedBuffer,
//           uniqueFilename,
//           userId,
//           file.mimetype
//         );

//         if (!originalUpload.success) {
//           uploadResults.push({
//             filename: file.originalname,
//             success: false,
//             error: 'Failed to upload original image'
//           });
//           continue;
//         }

//         // Upload thumbnail
//         const thumbnailUpload = await storageService.uploadFile(
//           thumbnailBuffer,
//           thumbnailFilename,
//           userId,
//           'image/jpeg'
//         );

//         if (!thumbnailUpload.success) {
//           // Clean up original if thumbnail fails
//           await storageService.deleteFile(originalUpload.path);
//           uploadResults.push({
//             filename: file.originalname,
//             success: false,
//             error: 'Failed to upload thumbnail'
//           });
//           continue;
//         }

//         // Insert image record
//         const { data: imageRecord, error: imageError } = await supabaseAdmin
//           .from('images')
//           .insert({
//             user_id: userId,
//             filename: file.originalname,
//             original_path: originalUpload.path,
//             thumbnail_path: thumbnailUpload.path
//           })
//           .select()
//           .single();

//         if (imageError) {
//           // Clean up uploaded files
//           await storageService.deleteFile(originalUpload.path);
//           await storageService.deleteFile(thumbnailUpload.path);
//           uploadResults.push({
//             filename: file.originalname,
//             success: false,
//             error: 'Database error'
//           });
//           continue;
//         }

//         // Create metadata record
//         const { error: metadataError } = await supabaseAdmin
//           .from('image_metadata')
//           .insert({
//             image_id: imageRecord.id,
//             user_id: userId,
//             ai_processing_status: 'pending'
//           });

//         if (metadataError) {
//           console.error('Metadata creation error:', metadataError);
//         }

//         // Queue for AI processing
//         await queueImageProcessing({
//           imageId: imageRecord.id,
//           userId: userId,
//           filePath: originalUpload.path
//         });

//         uploadResults.push({
//           filename: file.originalname,
//           success: true,
//           imageId: imageRecord.id,
//           message: 'Upload successful, AI processing queued'
//         });

//       } catch (error) {
//         console.error(`Error processing ${file.originalname}:`, error);
//         uploadResults.push({
//           filename: file.originalname,
//           success: false,
//           error: error.message
//         });
//       }
//     }

//     const successCount = uploadResults.filter(r => r.success).length;
//     const failCount = uploadResults.filter(r => !r.success).length;

//     res.json({
//       success: successCount > 0,
//       message: `${successCount} uploaded successfully, ${failCount} failed`,
//       results: uploadResults
//     });

//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({
//       error: 'Upload failed',
//       message: error.message
//     });
//   }
// });

// module.exports = router;
