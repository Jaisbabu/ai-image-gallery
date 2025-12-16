require('dotenv').config();
const Queue = require('bull');
const visionAI = require('./services/visionAI');
const storageService = require('./services/storage');
const { supabaseAdmin } = require('./config/supabase');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const imageProcessingQueue = new Queue('image-processing', REDIS_URL);

console.log('🧠 AI Worker started and listening for jobs...');

imageProcessingQueue.process(1, async (job) => {
  const { imageId, filePath } = job.data;

  console.log(`🔄 Processing image ${imageId}`);

  try {
    // 1️⃣ Mark as processing
    await supabaseAdmin
      .from('image_metadata')
      .update({ ai_processing_status: 'processing' })
      .eq('image_id', imageId);

    // 2️⃣ Download image
    const imageBuffer = await storageService.downloadFile(filePath);
    if (!imageBuffer) {
      throw new Error('Failed to download image from storage');
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

    await supabaseAdmin
      .from('image_metadata')
      .update({
        ai_processing_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('image_id', imageId);

    throw err;
  }
});


// require('dotenv').config();
// const Queue = require('bull');
// const visionAI = require('./services/visionAI');
// const storageService = require('./services/storage');
// const { supabaseAdmin } = require('./config/supabase');

// const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// const imageProcessingQueue = new Queue('image-processing', REDIS_URL);

// console.log('🧠 AI Worker started and listening for jobs...');

// imageProcessingQueue.process(async (job) => {
//   const { imageId, filePath } = job.data;

//   console.log(`🔄 Processing image ${imageId}`);

//   try {
//     // 1️⃣ Mark as processing
//     await supabaseAdmin
//       .from('image_metadata')
//       .update({ ai_processing_status: 'processing' })
//       .eq('image_id', imageId);

//     // 2️⃣ Download image
//     const imageBuffer = await storageService.downloadFile(filePath);
//     if (!imageBuffer) {
//       throw new Error('Failed to download image from storage');
//     }

//     // 3️⃣ Run Vision AI
//     const analysis = await visionAI.analyzeImage(imageBuffer);

//     if (!analysis || analysis.success !== true) {
//       throw new Error(
//         analysis?.error || 'Vision AI returned invalid response'
//       );
//     }

//     // 4️⃣ Save results
//     await supabaseAdmin
//       .from('image_metadata')
//       .update({
//         description: analysis.description,
//         tags: analysis.tags,
//         colors: analysis.colors,
//         ai_processing_status: 'completed',
//         updated_at: new Date().toISOString()
//       })
//       .eq('image_id', imageId);

//     console.log(`✅ AI completed for image ${imageId}`);
//     return true;

//   } catch (err) {
//     console.error(`❌ AI failed for image ${imageId}:`, err);

//     // 🔴 FINAL STATE — DO NOT RETRY LOGIC IN DB
//     await supabaseAdmin
//       .from('image_metadata')
//       .update({
//         ai_processing_status: 'failed',
//         updated_at: new Date().toISOString()
//       })
//       .eq('image_id', imageId);

//     throw err; // let Bull handle retries/logging
//   }
// });



// require('dotenv').config();
// const Queue = require('bull');
// const visionAI = require('./services/visionAI');
// const storageService = require('./services/storage');
// const { supabaseAdmin } = require('./config/supabase');

// const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// const imageProcessingQueue = new Queue('image-processing', REDIS_URL);

// console.log('🧠 AI Worker started...');

// imageProcessingQueue.process(async (job) => {
//   const { imageId, filePath } = job.data;

//   try {
//     await supabaseAdmin
//       .from('image_metadata')
//       .update({ ai_processing_status: 'processing' })
//       .eq('image_id', imageId);

//     const imageBuffer = await storageService.downloadFile(filePath);
//     if (!imageBuffer) {
//       throw new Error('Image download failed');
//     }

//     const analysis = await visionAI.analyzeImage(imageBuffer);
//     if (!analysis?.success) {
//       throw new Error('Vision AI failed');
//     }

//     await supabaseAdmin
//       .from('image_metadata')
//       .update({
//         description: analysis.description,
//         tags: analysis.tags,
//         colors: analysis.colors,
//         ai_processing_status: 'completed',
//         updated_at: new Date().toISOString()
//       })
//       .eq('image_id', imageId);

//     console.log(`✅ AI completed for image ${imageId}`);
//     return true;

//   } catch (err) {
//     console.error(`❌ AI failed for image ${imageId}:`, err.message);

//     await supabaseAdmin
//       .from('image_metadata')
//       .update({
//         ai_processing_status: 'pending',
//         updated_at: new Date().toISOString()
//       })
//       .eq('image_id', imageId);

//     throw err;
//   }
// });
