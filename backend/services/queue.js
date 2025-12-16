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


