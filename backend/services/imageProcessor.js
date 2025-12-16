const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class ImageProcessor {
  /**
   * Generate thumbnail from image buffer
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {number} size - Thumbnail size (default 300x300)
   * @returns {Promise<Buffer>} Thumbnail buffer
   */
  async generateThumbnail(imageBuffer, size = 300) {
    try {
      return await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Validate image format and size
   * @param {Buffer} imageBuffer - Image buffer
   * @param {number} maxSizeMB - Maximum size in MB (default 10)
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(imageBuffer, maxSizeMB = 10) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      const sizeInMB = imageBuffer.length / (1024 * 1024);
      const validFormats = ['jpeg', 'jpg', 'png', 'webp'];

      return {
        valid: validFormats.includes(metadata.format) && sizeInMB <= maxSizeMB,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        sizeMB: sizeInMB.toFixed(2),
        error: sizeInMB > maxSizeMB 
          ? `Image too large (${sizeInMB.toFixed(2)}MB). Max: ${maxSizeMB}MB` 
          : !validFormats.includes(metadata.format)
          ? `Invalid format: ${metadata.format}. Allowed: ${validFormats.join(', ')}`
          : null
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid image file'
      };
    }
  }

  /**
   * Optimize image for storage
   * @param {Buffer} imageBuffer - Original image buffer
   * @returns {Promise<Buffer>} Optimized buffer
   */
  async optimizeImage(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // If image is too large, resize it
      let pipeline = sharp(imageBuffer);
      
      if (metadata.width > 2400 || metadata.height > 2400) {
        pipeline = pipeline.resize(2400, 2400, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      return await pipeline
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();
    } catch (error) {
      console.error('Image optimization error:', error);
      return imageBuffer; // Return original if optimization fails
    }
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalName) {
    const extension = originalName.split('.').pop().toLowerCase();
    const uuid = uuidv4();
    return `${uuid}.${extension}`;
  }

  /**
   * Get file extension from mimetype
   * @param {string} mimetype - MIME type
   * @returns {string} File extension
   */
  getExtensionFromMimeType(mimetype) {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };
    return mimeMap[mimetype] || 'jpg';
  }
}

module.exports = new ImageProcessor();
