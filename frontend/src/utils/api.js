import { getAuthHeaders } from './supabase';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  /**
   * Upload images
   */
  async uploadImages(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: headers.Authorization
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }
  
   /**
   * Tag Update
   */

    async updateImageTags(imageId, tags) {
    if (!Array.isArray(tags)) {
      throw new Error('Tags must be an array');
    }

    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/images/${imageId}/tags`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update tags');
    }

    return response.json();
  }


  /**
   * Get user's images
   */
  async getImages(page = 1, limit = 20, options = {}) {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/images?page=${page}&limit=${limit}`,
      {
        headers,
        signal: options.signal
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }

    return response.json();
  }

  async getImage(imageId, options = {}) {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/images/${imageId}`,
      {
        headers,
        signal: options.signal
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    return response.json();
  }

  async deleteImage(imageId) {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/images/${imageId}`,
      {
        method: 'DELETE',
        headers
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    return response.json();
  }


async searchByText(query, page = 1, limit = 20, options = {}) {
  const headers = await getAuthHeaders();
  const mode = options.mode || 'strict';

  const response = await fetch(
    `${API_BASE_URL}/search/text?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&mode=${mode}`,
    {
      headers,
      signal: options.signal
    }
  );

  // Abort → silent
  if (options.signal?.aborted) return null;

  // Invalid query → NOT an error
  if (response.status === 400) {
    return { images: [], pagination: null };
  }

  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }

  return response.json();
}


  async findSimilar(imageId, limit = 12) {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_BASE_URL}/search/similar/${imageId}?limit=${limit}`,
    {
      headers
    }
  );

  if (!response.ok) {
    throw new Error(`Similar search failed (${response.status})`);
  }

  return response.json();
}


  async filterByColor(color, page = 1, limit = 20, options = {}) {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/search/color?color=${encodeURIComponent(color)}&page=${page}&limit=${limit}`,
      {
        headers,
        signal: options.signal
      }
    );

    if (!response.ok) {
      throw new Error('Color filter failed');
    }

    return response.json();
  }
}

export default new ApiService();


















