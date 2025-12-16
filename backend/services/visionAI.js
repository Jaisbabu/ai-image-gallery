const vision = require('@google-cloud/vision');

class VisionAIService {
  constructor() {
    // Initialize the client
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  }

  /**
   * Analyze an image and extract tags, description, and colors
   * @param {Buffer} imageBuffer - The image buffer
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeImage(imageBuffer) {
    try {
      const [result] = await this.client.annotateImage({
        image: { content: imageBuffer },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'IMAGE_PROPERTIES' }
        ]
      });

      // Extract tags from labels
      const tags = result.labelAnnotations
        ? result.labelAnnotations
            .slice(0, 10)
            .map(label => label.description.toLowerCase())
        : [];

      // Generate description from top labels
      const description = this.generateDescription(result.labelAnnotations);

      // Extract dominant colors
      const colors = this.extractDominantColors(result.imagePropertiesAnnotation);

      return {
        tags,
        description,
        colors,
        success: true
      };
    } catch (error) {
      console.error('Vision AI Error:', error);
      return {
        tags: [],
        description: 'Analysis failed',
        colors: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a descriptive sentence from labels
   * @param {Array} labels - Label annotations from Vision AI
   * @returns {string} Description
   */
  generateDescription(labels) {
    if (!labels || labels.length === 0) {
      return 'No description available';
    }

    // Use top 3-5 labels with highest confidence
    const topLabels = labels
      .slice(0, 5)
      .map(label => label.description.toLowerCase());

    // Create a natural sentence
    if (topLabels.length === 1) {
      return `An image featuring ${topLabels[0]}.`;
    } else if (topLabels.length === 2) {
      return `An image featuring ${topLabels[0]} and ${topLabels[1]}.`;
    } else {
      const lastLabel = topLabels.pop();
      return `An image featuring ${topLabels.join(', ')}, and ${lastLabel}.`;
    }
  }

  /**
   * Extract top 3 dominant colors and convert to hex
   * @param {Object} imageProperties - Image properties from Vision AI
   * @returns {Array<string>} Array of hex color codes
   */
  extractDominantColors(imageProperties) {
    if (!imageProperties || !imageProperties.dominantColors) {
      return ['#808080', '#A0A0A0', '#C0C0C0']; // Default grays
    }

    const colors = imageProperties.dominantColors.colors
      .slice(0, 3)
      .map(colorInfo => {
        const { red = 0, green = 0, blue = 0 } = colorInfo.color;
        return this.rgbToHex(red, green, blue);
      });

    // Ensure we always have 3 colors
    while (colors.length < 3) {
      colors.push('#808080');
    }

    return colors;
  }

  /**
   * Convert RGB to Hex color code
   * @param {number} r - Red value (0-255)
   * @param {number} g - Green value (0-255)
   * @param {number} b - Blue value (0-255)
   * @returns {string} Hex color code
   */
  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(n).toString(16).padStart(2, '0');
      return hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Batch analyze multiple images
   * @param {Array<Buffer>} imageBuffers - Array of image buffers
   * @returns {Promise<Array<Object>>} Array of analysis results
   */
  async batchAnalyze(imageBuffers) {
    const results = await Promise.allSettled(
      imageBuffers.map(buffer => this.analyzeImage(buffer))
    );

    return results.map((result, index) => ({
      index,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }
}

module.exports = new VisionAIService();
