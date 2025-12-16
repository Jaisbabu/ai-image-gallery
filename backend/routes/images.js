const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const storageService = require('../services/storage');

const router = express.Router();

/**
 * GET /api/images
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { data: images, error, count } = await req.supabase
      .from('images')
      .select(
        `
        id,
        filename,
        original_path,
        thumbnail_path,
        uploaded_at,
        image_metadata (
          description,
          tags,
          colors,
          ai_processing_status
        )
        `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 🔴 IMPORTANT: collect only valid paths
    const thumbnailPaths = images
      .map(i => i.thumbnail_path)
      .filter(Boolean);

    // ✅ THIS RETURNS { path: signedUrl }
    const urlMap = await storageService.getMultipleSignedUrls(thumbnailPaths);

    const imagesWithUrls = images.map(img => ({
      id: img.id,
      filename: img.filename,
      original_path: img.original_path,
      thumbnail_path: img.thumbnail_path,
      uploaded_at: img.uploaded_at,

      // ✅ CORRECT LOOKUP
      thumbnailUrl: urlMap[img.thumbnail_path] || null,

      metadata: img.image_metadata?.[0] || null
    }));

    res.json({
      success: true,
      images: imagesWithUrls,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (err) {
    console.error('Get images error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

/**
 * GET /api/images/:id
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;

    const { data: image, error } = await req.supabase
      .from('images')
      .select(
        `
        id,
        filename,
        original_path,
        thumbnail_path,
        uploaded_at,
        image_metadata (
          description,
          tags,
          colors,
          ai_processing_status
        )
        `
      )
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (error || !image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const [originalUrl, thumbnailUrl] = await Promise.all([
      storageService.getSignedUrl(image.original_path),
      storageService.getSignedUrl(image.thumbnail_path)
    ]);

    res.json({
      success: true,
      image: {
        id: image.id,
        filename: image.filename,
        uploaded_at: image.uploaded_at,
        originalUrl,
        thumbnailUrl,
        metadata: image.image_metadata?.[0] || null
      }
    });

  } catch (err) {
    console.error('Get image error:', err);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});


/**
 * PATCH /api/images/:id/tags
 * Update image tags
 */
router.patch('/:id/tags', authenticateUser, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    const { error } = await req.supabase
      .from('image_metadata')
      .update({ tags })
      .eq('image_id', imageId);
      // .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, tags });
  } catch (err) {
    console.error('Update tags error:', err);
    res.status(500).json({ error: 'Failed to update tags' });
  }
});



/**
 * DELETE /api/images/:id
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;

    const { data: image, error } = await req.supabase
      .from('images')
      .select('original_path, thumbnail_path')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (error || !image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await req.supabase.from('image_metadata').delete().eq('image_id', imageId);
    await req.supabase.from('images').delete().eq('id', imageId);

    // Best-effort cleanup
    Promise.allSettled([
      storageService.deleteFile(image.original_path),
      storageService.deleteFile(image.thumbnail_path)
    ]);

    res.json({ success: true });

  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;




// const express = require('express');
// const { authenticateUser } = require('../middleware/auth');
// const storageService = require('../services/storage');

// const router = express.Router();

// /**
//  * GET /api/images
//  */
// router.get('/', authenticateUser, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const offset = (page - 1) * limit;

//     const { data: images, error, count } = await req.supabase
//       .from('images')
//       .select(
//         `
//         id,
//         filename,
//         original_path,
//         thumbnail_path,
//         uploaded_at,
//         image_metadata (
//           description,
//           tags,
//           colors,
//           ai_processing_status
//         )
//         `,
//         { count: 'exact' }
//       )
//       .eq('user_id', userId)
//       .order('uploaded_at', { ascending: false })
//       .range(offset, offset + limit - 1);

//     if (error) throw error;

//     const thumbnailPaths = images.map(i => i.thumbnail_path);
//     const signedUrls = await storageService.getMultipleSignedUrls(thumbnailPaths);

//     // Build path → url map correctly
//     const urlMap = {};
//     thumbnailPaths.forEach((path, index) => {
//       urlMap[path] = signedUrls[index] || null;
//     });

//     const imagesWithUrls = images.map(img => ({
//       id: img.id,
//       filename: img.filename,
//       original_path: img.original_path,
//       thumbnail_path: img.thumbnail_path,
//       uploaded_at: img.uploaded_at,
//       thumbnailUrl: urlMap[img.thumbnail_path],
//       metadata: img.image_metadata?.[0] || null
//     }));

//     res.json({
//       success: true,
//       images: imagesWithUrls,
//       pagination: {
//         page,
//         limit,
//         total: count,
//         totalPages: Math.ceil(count / limit)
//       }
//     });

//   } catch (error) {
//     console.error('Get images error:', error);
//     res.status(500).json({ error: 'Failed to fetch images' });
//   }
// });

// /**
//  * GET /api/images/:id
//  */
// router.get('/:id', authenticateUser, async (req, res) => {
//   try {
//     const imageId = req.params.id;
//     const userId = req.user.id;

//     const { data: image, error } = await req.supabase
//       .from('images')
//       .select(
//         `
//         id,
//         filename,
//         original_path,
//         thumbnail_path,
//         uploaded_at,
//         image_metadata (
//           description,
//           tags,
//           colors,
//           ai_processing_status
//         )
//         `
//       )
//       .eq('id', imageId)
//       .eq('user_id', userId)
//       .single();

//     if (error || !image) {
//       return res.status(404).json({ error: 'Image not found' });
//     }

//     const [originalUrl, thumbnailUrl] = await Promise.all([
//       storageService.getSignedUrl(image.original_path),
//       storageService.getSignedUrl(image.thumbnail_path)
//     ]);

//     res.json({
//       success: true,
//       image: {
//         id: image.id,
//         filename: image.filename,
//         uploaded_at: image.uploaded_at,
//         originalUrl,
//         thumbnailUrl,
//         metadata: image.image_metadata?.[0] || null
//       }
//     });

//   } catch (error) {
//     console.error('Get image error:', error);
//     res.status(500).json({ error: 'Failed to fetch image' });
//   }
// });

// /**
//  * DELETE /api/images/:id
//  */
// router.delete('/:id', authenticateUser, async (req, res) => {
//   try {
//     const imageId = req.params.id;
//     const userId = req.user.id;

//     const { data: image, error } = await req.supabase
//       .from('images')
//       .select('original_path, thumbnail_path')
//       .eq('id', imageId)
//       .eq('user_id', userId)
//       .single();

//     if (error || !image) {
//       return res.status(404).json({ error: 'Image not found' });
//     }

//     await req.supabase.from('image_metadata').delete().eq('image_id', imageId);
//     await req.supabase.from('images').delete().eq('id', imageId);

//     // Best-effort storage cleanup
//     Promise.allSettled([
//       storageService.deleteFile(image.original_path),
//       storageService.deleteFile(image.thumbnail_path)
//     ]);

//     res.json({ success: true });

//   } catch (error) {
//     console.error('Delete image error:', error);
//     res.status(500).json({ error: 'Failed to delete image' });
//   }
// });

// module.exports = router;



// const express = require('express');
// const { authenticateUser } = require('../middleware/auth');
// const storageService = require('../services/storage');

// const router = express.Router();

// /**
//  * GET /api/images
//  */
// router.get('/', authenticateUser, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const page = parseInt(req.query.page || '1', 10);
//     const limit = parseInt(req.query.limit || '20', 10);
//     const offset = (page - 1) * limit;

//     const { data, error, count } = await req.supabase
//       .from('images')
//       .select(
//         `
//         id,
//         filename,
//         original_path,
//         thumbnail_path,
//         uploaded_at,
//         image_metadata (
//           description,
//           tags,
//           colors,
//           ai_processing_status
//         )
//         `,
//         { count: 'exact' }
//       )
//       .eq('user_id', userId)
//       .order('uploaded_at', { ascending: false })
//       .range(offset, offset + limit - 1);

//     if (error) throw error;

//     // Collect paths
//     const thumbnailPaths = data.map(i => i.thumbnail_path).filter(Boolean);
//     const originalPaths = data.map(i => i.original_path).filter(Boolean);

//     // 🔑 IMPORTANT: these return MAPS, not arrays
//     const thumbnailUrlMap =
//       await storageService.getMultipleSignedUrls(thumbnailPaths);
//     const originalUrlMap =
//       await storageService.getMultipleSignedUrls(originalPaths);

//     const images = data.map(img => ({
//       id: img.id,
//       filename: img.filename,
//       uploaded_at: img.uploaded_at,
//       thumbnailUrl: thumbnailUrlMap[img.thumbnail_path] || null,
//       originalUrl: originalUrlMap[img.original_path] || null,
//       metadata: img.image_metadata || null
//     }));

//     res.json({
//       images,
//       pagination: {
//         page,
//         limit,
//         total: count,
//         totalPages: Math.ceil(count / limit)
//       }
//     });

//   } catch (err) {
//     console.error('Get images error:', err);
//     res.status(500).json({ error: 'Failed to fetch images' });
//   }
// });

// /**
//  * GET /api/images/:id
//  */
// router.get('/:id', authenticateUser, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const { data, error } = await req.supabase
//       .from('images')
//       .select(
//         `
//         id,
//         filename,
//         original_path,
//         thumbnail_path,
//         uploaded_at,
//         image_metadata (
//           description,
//           tags,
//           colors,
//           ai_processing_status
//         )
//         `
//       )
//       .eq('id', id)
//       .eq('user_id', userId)
//       .single();

//     if (error || !data) {
//       return res.status(404).json({ error: 'Image not found' });
//     }

//     const [originalUrl, thumbnailUrl] = await Promise.all([
//       storageService.getSignedUrl(data.original_path),
//       storageService.getSignedUrl(data.thumbnail_path)
//     ]);

//     res.json({
//       image: {
//         id: data.id,
//         filename: data.filename,
//         uploaded_at: data.uploaded_at,
//         originalUrl,
//         thumbnailUrl,
//         metadata: data.image_metadata || null
//       }
//     });

//   } catch (err) {
//     console.error('Get image error:', err);
//     res.status(500).json({ error: 'Failed to fetch image' });
//   }
// });

// module.exports = router;



