require('dotenv').config();
const Queue = require('bull');
const visionAI = require('./services/visionAI');
const storageService = require('./services/storage');
const { supabaseAdmin } = require('./config/supabase');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const imageProcessingQueue = new Queue('image-processing', REDIS_URL);

console.log('🧠 AI Worker started and listening for jobs...');

imageProcessingQueue.process(1, async (job) => {
  const { imageId, imageUrl } = job.data;


  console.log(`🔄 Processing image ${imageId}`);

  try {
    // 1️⃣ Mark as processing
    await supabaseAdmin
      .from('image_metadata')
      .update({ ai_processing_status: 'processing' })
      .eq('image_id', imageId);

    
    // 2️⃣ Download image via URL
const imageBuffer = await storageService.downloadFromUrl(imageUrl);
if (!imageBuffer) {
  throw new Error('Failed to download image from URL');
}


    // 3️⃣ Run Vision AI
    const analysis = await visionAI.analyzeImage(imageBuffer);
    if (!analysis?.success) {
      throw new Error(analysis?.error || 'Vision AI failed');
    }

    // 4️⃣ Save results
    await supabaseAdmin
      .from('image_metadata')
      .update({
        description: analysis.description,
        tags: analysis.tags,
        colors: analysis.colors,
        ai_processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('image_id', imageId);

    console.log(`✅ AI completed for image ${imageId}`);
    return true;

  } catch (err) {
  console.error(`❌ AI failed for image ${imageId}:`, err.message);

  // ⛔ NON-RETRYABLE errors → mark failed and STOP
  if (
    err.message.includes('404') ||
    err.message.includes('400') ||
    err.message.includes('Failed to download image')
  ) {
    await supabaseAdmin
      .from('image_metadata')
      .update({
        ai_processing_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('image_id', imageId);

    console.warn(`🛑 Permanent failure for image ${imageId}. Job will NOT retry.`);
    return false; // stop job permanently
  }

  // 🔁 RETRYABLE → DO NOT update DB
  throw err;
}


});


