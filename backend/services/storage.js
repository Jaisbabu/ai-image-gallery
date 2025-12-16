const { supabaseAdmin } = require('../config/supabase');

class StorageService {
  constructor() {
    this.bucketName = 'images';
  }

  async initializeBucket() {
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const exists = buckets?.some(b => b.name === this.bucketName);

      if (!exists) {
        await supabaseAdmin.storage.createBucket(this.bucketName, {
          public: false,
          fileSizeLimit: 10 * 1024 * 1024 // 10MB
        });
        console.log('✓ Storage bucket created');
      }
    } catch (err) {
      console.error('Bucket init failed:', err);
    }
  }

  async uploadFile(buffer, filename, userId, contentType = 'image/jpeg') {
    try {
      const path = `${userId}/${filename}`;

      const { error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .upload(path, buffer, {
          contentType,
          upsert: false
        });

      if (error) throw error;

      return { success: true, path };
    } catch (err) {
      console.error('Upload error:', err);
      return { success: false, error: err.message };
    }
  }

  async downloadFile(filePath) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .download(filePath);

      if (error || !data) throw error;

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      console.error('Download error:', err);
      return null;
    }
  }

  async deleteFile(filePath) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      return false;
    }
  }

  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Signed URL error:', err);
      return null;
    }
  }

  async getMultipleSignedUrls(filePaths, expiresIn = 3600) {
    if (!filePaths || filePaths.length === 0) return {};

    try {
      const { data, error } = await supabaseAdmin.storage
        .from(this.bucketName)
        .createSignedUrls(filePaths, expiresIn);

      if (error) throw error;

      const map = {};
      for (const item of data) {
        if (item.path && item.signedUrl) {
          map[item.path] = item.signedUrl;
        }
      }

      return map;
    } catch (err) {
      console.error('Multiple signed URLs error:', err);
      return {};
    }
  }
}

module.exports = new StorageService();


// const { supabaseAdmin } = require('../config/supabase');

// class StorageService {
//   constructor() {
//     this.bucketName = 'images';
//   }

//   async initializeBucket() {
//     try {
//       const { data: buckets, error } =
//         await supabaseAdmin.storage.listBuckets();

//       if (error) throw error;

//       const exists = buckets.some(b => b.name === this.bucketName);

//       if (!exists) {
//         await supabaseAdmin.storage.createBucket(this.bucketName, {
//           public: false,
//           fileSizeLimit: 10 * 1024 * 1024 // 10MB
//         });
//         console.log('✓ Storage bucket created');
//       }
//     } catch (error) {
//       console.error('Bucket initialization error:', error);
//     }
//   }

//   async uploadFile(buffer, filename, userId, contentType = 'image/jpeg') {
//     try {
//       const filePath = `${userId}/${filename}`;

//       const { error } = await supabaseAdmin.storage
//         .from(this.bucketName)
//         .upload(filePath, buffer, {
//           contentType,
//           upsert: false
//         });

//       if (error) throw error;

//       return { success: true, path: filePath };
//     } catch (error) {
//       console.error('File upload error:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   async deleteFile(filePath) {
//     try {
//       const { error } = await supabaseAdmin.storage
//         .from(this.bucketName)
//         .remove([filePath]);

//       if (error) throw error;
//       return true;
//     } catch (error) {
//       console.error('File delete error:', error);
//       return false;
//     }
//   }

//   async getSignedUrl(filePath, expiresIn = 3600) {
//     try {
//       const { data, error } = await supabaseAdmin.storage
//         .from(this.bucketName)
//         .createSignedUrl(filePath, expiresIn);

//       if (error) throw error;
//       return data.signedUrl;
//     } catch (error) {
//       console.error('Signed URL error:', error);
//       return null;
//     }
//   }

//   async getMultipleSignedUrls(filePaths, expiresIn = 3600) {
//     if (!filePaths || filePaths.length === 0) return {};

//     try {
//       const { data, error } = await supabaseAdmin.storage
//         .from(this.bucketName)
//         .createSignedUrls(filePaths, expiresIn);

//       if (error) throw error;

//       const map = {};
//       for (const item of data) {
//         if (item?.path && item?.signedUrl) {
//           map[item.path] = item.signedUrl;
//         }
//       }

//       return map;
//     } catch (error) {
//       console.error('Multiple signed URLs error:', error);
//       return {};
//     }
//   }

//   // ✅ THIS WAS MISSING — WORKER DEPENDS ON IT
//   async downloadFile(filePath) {
//     try {
//       const { data, error } = await supabaseAdmin.storage
//         .from(this.bucketName)
//         .download(filePath);

//       if (error) throw error;

//       const arrayBuffer = await data.arrayBuffer();
//       return Buffer.from(arrayBuffer);
//     } catch (error) {
//       console.error('File download error:', error);
//       return null;
//     }
//   }
// }

// module.exports = new StorageService();


