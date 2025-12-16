import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ImageUpload = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(
      acceptedFiles.map(file => ({
        name: file.name,
        status: 'uploading',
        message: 'Uploading...'
      }))
    );

    try {
      const result = await api.uploadImages(acceptedFiles);

      const progress = result.results.map(r => ({
        name: r.filename,
        status: r.success ? 'success' : 'error',
        message: r.success ? 'AI analysis queued' : r.error
      }));

      setUploadProgress(progress);

      if (result.success) {
        toast.success(result.message);
        setUploadProgress([]);
onUploadComplete?.(); // trigger immediate reload & polling

      } else {
        toast.error('Some uploads failed');
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
      setUploadProgress([]);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 10,
    disabled: uploading
  });

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return (
    <div className="w-full flex justify-center my-10">
      <div className="w-full max-w-3xl relative">
        {/* Close button */}
        {!uploading && (
          <button
            onClick={onUploadComplete}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full
                       bg-black/60 hover:bg-black/80
                       flex items-center justify-center
                       text-white transition"
            aria-label="Close upload"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${isDragActive
              ? 'border-purple-400 bg-purple-500/10 scale-[1.02]'
              : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload
            className={`w-12 h-12 mx-auto mb-4 ${
              isDragActive
                ? 'text-purple-400 animate-bounce'
                : 'text-purple-300'
            }`}
          />
          <h3 className="text-xl font-semibold text-white mb-2">
            {isDragActive ? 'Drop images here' : 'Upload Your Images'}
          </h3>
          <p className="text-purple-200 text-sm mb-4">
            Drag & drop or click to select
          </p>
          <p className="text-xs text-purple-300">
            JPEG, PNG, WebP • Max 10MB • Up to 10 files
          </p>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">
                Upload Progress
              </h4>
              {!uploading && (
                <button
                  onClick={clearProgress}
                  className="text-purple-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {uploadProgress.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-sm p-2 rounded-lg bg-white/5"
                >
                  {item.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{item.name}</p>
                    <p
                      className={`text-xs ${
                        item.status === 'error'
                          ? 'text-red-300'
                          : 'text-purple-300'
                      }`}
                    >
                      {item.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;















// import React, { useCallback, useState } from 'react';
// import { useDropzone } from 'react-dropzone';
// import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
// import api from '../utils/api';
// import toast from 'react-hot-toast';

// const ImageUpload = ({ onUploadComplete }) => {
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState([]);

//   const onDrop = useCallback(async (acceptedFiles) => {
//     if (acceptedFiles.length === 0) return;

//     setUploading(true);
//     setUploadProgress(
//       acceptedFiles.map(file => ({
//         name: file.name,
//         status: 'uploading',
//         message: 'Uploading...'
//       }))
//     );

//     try {
//       const result = await api.uploadImages(acceptedFiles);

//       const progress = result.results.map(r => ({
//         name: r.filename,
//         status: r.success ? 'success' : 'error',
//         message: r.success ? 'AI analysis queued' : r.error
//       }));

//       setUploadProgress(progress);

//       if (result.success) {
//         toast.success(result.message);
//         setTimeout(() => {
//           setUploadProgress([]);
//           onUploadComplete?.();
//         }, 3000);
//       } else {
//         toast.error('Some uploads failed');
//       }
//     } catch (error) {
//       toast.error(error.message || 'Upload failed');
//       setUploadProgress([]);
//     } finally {
//       setUploading(false);
//     }
//   }, [onUploadComplete]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       'image/jpeg': ['.jpg', '.jpeg'],
//       'image/png': ['.png'],
//       'image/webp': ['.webp']
//     },
//     maxSize: 10 * 1024 * 1024,
//     maxFiles: 10,
//     disabled: uploading
//   });

//   const clearProgress = () => {
//     setUploadProgress([]);
//   };

//   return (
//     <div className="w-full flex justify-center my-10">
//       <div className="w-full max-w-3xl">
//         {/* Drop Zone */}
//         <div
//           {...getRootProps()}
//           className={`
//             border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
//             ${isDragActive
//               ? 'border-purple-400 bg-purple-500/10 scale-[1.02]'
//               : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
//             }
//             ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
//           `}
//         >
//           <input {...getInputProps()} />
//           <Upload
//             className={`w-12 h-12 mx-auto mb-4 ${
//               isDragActive
//                 ? 'text-purple-400 animate-bounce'
//                 : 'text-purple-300'
//             }`}
//           />
//           <h3 className="text-xl font-semibold text-white mb-2">
//             {isDragActive ? 'Drop images here' : 'Upload Your Images'}
//           </h3>
//           <p className="text-purple-200 text-sm mb-4">
//             Drag & drop or click to select
//           </p>
//           <p className="text-xs text-purple-300">
//             JPEG, PNG, WebP • Max 10MB • Up to 10 files
//           </p>
//         </div>

//         {/* Upload Progress */}
//         {uploadProgress.length > 0 && (
//           <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
//             <div className="flex items-center justify-between mb-3">
//               <h4 className="text-sm font-semibold text-white">
//                 Upload Progress
//               </h4>
//               {!uploading && (
//                 <button
//                   onClick={clearProgress}
//                   className="text-purple-300 hover:text-white transition"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               )}
//             </div>

//             <div className="space-y-2">
//               {uploadProgress.map((item, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center gap-3 text-sm p-2 rounded-lg bg-white/5"
//                 >
//                   {item.status === 'uploading' && (
//                     <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
//                   )}
//                   {item.status === 'success' && (
//                     <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
//                   )}
//                   {item.status === 'error' && (
//                     <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
//                   )}
//                   <div className="flex-1 min-w-0">
//                     <p className="text-white truncate">{item.name}</p>
//                     <p
//                       className={`text-xs ${
//                         item.status === 'error'
//                           ? 'text-red-300'
//                           : 'text-purple-300'
//                       }`}
//                     >
//                       {item.message}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ImageUpload;


