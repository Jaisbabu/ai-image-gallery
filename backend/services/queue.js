const Queue = require('bull');
const { supabaseAdmin } = require('../config/supabase');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const imageProcessingQueue = new Queue('image-processing', REDIS_URL);

/**
 * Add image to processing queue
 */
async function queueImageProcessing(imageData) {
  try {
    const job = await imageProcessingQueue.add(imageData, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000
      },
      removeOnComplete: true,
      removeOnFail: false
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error('Queue add error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  imageProcessingQueue,
  queueImageProcessing
};



// const Queue = require('bull');
// const visionAI = require('./visionAI');
// const storageService = require('./storage');
// const { supabaseAdmin } = require('../config/supabase');

// // Create queue for image processing
// const imageProcessingQueue = new Queue('image-processing', process.env.REDIS_URL || 'redis://localhost:6379');

// /**
//  * Process image: analyze with AI and update metadata
//  */
// imageProcessingQueue.process(async (job) => {
//   const { imageId, userId, filePath } = job.data;

//   try {
//     // Update status to processing
//     await supabaseAdmin
//       .from('image_metadata')
//       .update({ ai_processing_status: 'processing' })
//       .eq('image_id', imageId);

//     // Download image from storage
//     const imageBuffer = await storageService.downloadFile(filePath);
    
//     if (!imageBuffer) {
//       throw new Error('Failed to download image from storage');
//     }

//     // Analyze with Vision AI
//     const analysis = await visionAI.analyzeImage(imageBuffer);

//     if (!analysis.success) {
//       throw new Error(analysis.error || 'AI analysis failed');
//     }

//     // Update metadata in database
//     const { error: updateError } = await supabaseAdmin
//       .from('image_metadata')
//       .update({
//         description: analysis.description,
//         tags: analysis.tags,
//         colors: analysis.colors,
//         ai_processing_status: 'completed',
//         updated_at: new Date().toISOString()
//       })
//       .eq('image_id', imageId);

//     if (updateError) {
//       throw updateError;
//     }

//     return {
//       success: true,
//       imageId,
//       analysis
//     };
//   } catch (error) {
//     console.error(`Job failed for image ${imageId}:`, error);

//     // Update status to failed
//     await supabaseAdmin
//       .from('image_metadata')
//       .update({ 
//         ai_processing_status: 'failed',
//         updated_at: new Date().toISOString()
//       })
//       .eq('image_id', imageId);

//     throw error;
//   }
// });

// /**
//  * Add image to processing queue
//  * @param {Object} imageData - Image data
//  * @returns {Promise<Object>} Job info
//  */
// async function queueImageProcessing(imageData) {
//   try {
//     const job = await imageProcessingQueue.add(imageData, {
//       attempts: 3,
//       backoff: {
//         type: 'exponential',
//         delay: 2000
//       },
//       removeOnComplete: true,
//       removeOnFail: false
//     });

//     return {
//       success: true,
//       jobId: job.id
//     };
//   } catch (error) {
//     console.error('Queue error:', error);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// }

// /**
//  * Get job status
//  * @param {string} jobId - Job ID
//  * @returns {Promise<Object>} Job status
//  */
// async function getJobStatus(jobId) {
//   try {
//     const job = await imageProcessingQueue.getJob(jobId);
    
//     if (!job) {
//       return { found: false };
//     }

//     const state = await job.getState();
//     const progress = job.progress();
//     const reason = job.failedReason;

//     return {
//       found: true,
//       state,
//       progress,
//       failedReason: reason
//     };
//   } catch (error) {
//     console.error('Job status error:', error);
//     return { found: false, error: error.message };
//   }
// }

// /**
//  * Clear completed jobs (maintenance)
//  */
// async function clearCompletedJobs() {
//   try {
//     await imageProcessingQueue.clean(24 * 3600 * 1000, 'completed'); // Clean jobs older than 24 hours
//     console.log('Completed jobs cleared');
//   } catch (error) {
//     console.error('Clear jobs error:', error);
//   }
// }

// // Clean completed jobs every hour
// setInterval(clearCompletedJobs, 3600000);

// module.exports = {
//   queueImageProcessing,
//   getJobStatus,
//   imageProcessingQueue
// };
