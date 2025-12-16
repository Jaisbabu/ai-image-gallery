const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const storageService = require('../services/storage');

const router = express.Router();

/* =========================================================
   GET /api/search/text
   ACTIVE STRATEGY (CURRENT):
   - TAG FIRST (exact match)
   - FALLBACK to description (substring)
   ========================================================= */

  // Hybrid search

  router.get('/text', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q?.trim().toLowerCase();
    const mode = req.query.mode || 'strict';

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Valid search query required' });
    }

    const { data, error } = await req.supabase
      .from('images')
      .select(`
        id,
        filename,
        original_path,
        thumbnail_path,
        uploaded_at,
        image_metadata!inner (
          description,
          tags,
          colors,
          ai_processing_status
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const queryWords = query.split(/\s+/);

    const finalResults = (data || []).filter(img => {
      const meta = img.image_metadata?.[0];
      if (!meta) return false;

      /* ================= LOOSE MODE ================= */
      if (mode === 'loose') {
        // Description: substring OK while typing
        if (meta.description?.toLowerCase().includes(query)) {
          return true;
        }

        // Tags: substring OK while typing
        return meta.tags?.some(tag =>
          tag.toLowerCase().includes(query)
        );
      }

      /* ================= STRICT MODE ================= */
      // Description: WORD-BASED match ONLY
      if (meta.description) {
        const descWords = meta.description
          .toLowerCase()
          .split(/\W+/);

        if (queryWords.every(qw => descWords.includes(qw))) {
          return true;
        }
      }

      // Tags: WORD-BASED match ONLY
      return meta.tags?.some(tag => {
        const tagWords = tag.toLowerCase().split(/\s+/);
        return queryWords.every(qw => tagWords.includes(qw));
      });
    });

    finalResults.sort(
      (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
    );

    const paginated = finalResults.slice(offset, offset + limit);
    const paths = paginated.map(i => i.thumbnail_path).filter(Boolean);
    const urlMap = await storageService.getMultipleSignedUrls(paths);

    res.json({
      success: true,
      query,
      images: paginated.map(img => ({
        id: img.id,
        filename: img.filename,
        original_path: img.original_path,
        thumbnail_path: img.thumbnail_path,
        uploaded_at: img.uploaded_at,
        thumbnailUrl: urlMap[img.thumbnail_path] || null,
        metadata: img.image_metadata?.[0] || null
      })),
      pagination: {
        page,
        limit,
        total: finalResults.length,
        totalPages: Math.ceil(finalResults.length / limit)
      }
    });

  } catch (err) {
    console.error('Text search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});




/* =========================================================
   GET /api/search/similar/:id
   ACTIVE STRATEGY:
   - Tag + color similarity scoring
   ========================================================= */

router.get('/similar/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const imageId = req.params.id;
    const limit = parseInt(req.query.limit, 10) || 12;

    const { data: source, error } = await req.supabase
      .from('images')
      .select(`
        id,
        image_metadata!inner ( tags, colors )
      `)
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (error || !source) {
      return res.status(404).json({ error: 'Source image not found' });
    }

    const sourceTags = source.image_metadata[0]?.tags || [];
    const sourceColors = source.image_metadata[0]?.colors || [];

    const { data: allImages, error: allError } = await req.supabase
      .from('images')
      .select(`
        id,
        filename,
        thumbnail_path,
        uploaded_at,
        image_metadata!inner ( tags, colors )
      `)
      .eq('user_id', userId)
      .neq('id', imageId);

    if (allError) throw allError;

    const scored = allImages.map(img => {
      const meta = img.image_metadata[0];
      const tagScore =
        sourceTags.filter(t => meta.tags.includes(t)).length /
        new Set([...sourceTags, ...meta.tags]).size;

      const colorScore =
        sourceColors.filter(c => meta.colors.includes(c)).length /
        (sourceColors.length || 1);

      return { ...img, similarity: tagScore * 0.7 + colorScore * 0.3 };
    });

    const top = scored
      .filter(i => i.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    const paths = top.map(i => i.thumbnail_path);
    const urlMap = await storageService.getMultipleSignedUrls(paths);

    res.json({
      success: true,
      images: top.map(i => ({
        ...i,
        thumbnailUrl: urlMap[i.thumbnail_path] || null
      }))
    });

  } catch {
    res.status(500).json({ error: 'Similar search failed' });
  }
});

/* =========================================================
   GET /api/search/color
   FIXED STRATEGY (ONLY CHANGE HERE):
   - Use PostgreSQL array containment (cs)
   - NO .contains()
   - NO forced uppercasing
   ========================================================= */

router.get('/color', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const color = req.query.color; // ✅ DO NOT mutate case

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return res.status(400).json({ error: 'Invalid color' });
    }

    const { data, error } = await req.supabase
      .from('images')
      .select(`
        id,
        filename,
        thumbnail_path,
        uploaded_at,
        image_metadata!inner ( colors )
      `)
      .eq('user_id', userId)
      // ✅ RESTORED WORKING OPERATOR
      .filter('image_metadata.colors', 'cs', `{${color}}`);

    if (error) throw error;

    const paths = data.map(i => i.thumbnail_path);
    const urlMap = await storageService.getMultipleSignedUrls(paths);

    res.json({
      success: true,
      images: data.map(i => ({
        ...i,
        thumbnailUrl: urlMap[i.thumbnail_path] || null
      }))
    });

  } catch {
    res.status(500).json({ error: 'Color search failed' });
  }
});


module.exports = router;



















