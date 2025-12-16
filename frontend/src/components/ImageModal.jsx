import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Copy,
  Download,
  Sparkles,
  Loader,
  Pencil,
  Check,
  XCircle
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ImageModal = ({
  image: initialImage,
  onClose,
  onDelete,
  onFindSimilar,
  onColorFilter,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  onTagsUpdated
}) => {
  const [image, setImage] = useState(initialImage);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 🔹 Tag editing state (NEW)
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editedTags, setEditedTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  // 🔒 prevents fetchDetails from overwriting saved tags
  const skipNextFetchRef = useRef(false);

  // sync image when navigating (OLD + NEW)
  useEffect(() => {
    setImage(initialImage);
    setIsEditingTags(false);
    setEditedTags(initialImage.metadata?.tags || []);
  }, [initialImage]);

  // ✅ KEYBOARD CONTROLS: ← → Esc (OLD)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      }
      if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  // fetch full image if needed (OLD + NEW)
  useEffect(() => {
    const fetchDetails = async () => {
      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false;
        return;
      }

      if (!image.originalUrl) {
        setLoading(true);
        try {
          const result = await api.getImage(image.id);
          setImage(result.image);
          setEditedTags(result.image.metadata?.tags || []);
        } catch {
          toast.error('Failed to load image details');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetails();
  }, [image.id, image.originalUrl]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    setDeleting(true);
    try {
      await api.deleteImage(image.id);
      toast.success('Image deleted successfully');
      onDelete?.(image.id);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to delete image');
      setDeleting(false);
    }
  };

  const handleCopyTags = () => {
    if (image.metadata?.tags) {
      navigator.clipboard.writeText(image.metadata.tags.join(', '));
      toast.success('Tags copied to clipboard');
    }
  };

  const handleDownload = async () => {
    if (!image.originalUrl) return;

    try {
      const response = await fetch(image.originalUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename || 'image';
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download image');
    }
  };

  // 🔹 TAG EDITING LOGIC (NEW)
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      const value = newTag.trim().toLowerCase();
      if (!editedTags.includes(value)) {
        setEditedTags(prev => [...prev, value]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setEditedTags(prev => prev.filter(t => t !== tag));
  };

  const handleSaveTags = async () => {
  try {
    let tagsToSave = editedTags;

    // ✅ ADD THIS: auto-add pending tag
    if (newTag.trim()) {
      const value = newTag.trim().toLowerCase();
      if (!tagsToSave.includes(value)) {
        tagsToSave = [...tagsToSave, value];
      }
      setNewTag('');
    }

    const result = await api.updateImageTags(image.id, tagsToSave);

    skipNextFetchRef.current = true;

    setImage(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: result.tags
      }
    }));

    setEditedTags(result.tags);
    onTagsUpdated?.(image.id, result.tags);

    setIsEditingTags(false);

    if (result.tags.length < tagsToSave.length) {
      toast('Some tags were removed because they were too generic');
    } else {
      toast.success('Tags updated');
    }
  } catch {
    toast.error('Failed to update tags');
  }
};




  const metadata = image.metadata;
  const isProcessing =
    metadata?.ai_processing_status === 'pending' ||
    metadata?.ai_processing_status === 'processing';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl w-full max-h-[90vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* IMAGE AREA */}
          <div className="relative flex-1 bg-black flex items-center justify-center p-8">
            {loading ? (
              <Loader className="w-12 h-12 text-purple-400 animate-spin" />
            ) : (
              <img
                src={image.originalUrl || image.thumbnailUrl}
                alt={image.filename}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {hasPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="
                  absolute left-3 top-1/2 -translate-y-1/2
                  w-9 h-9 rounded-full
                  flex items-center justify-center
                  text-3xl leading-none
                  bg-black/40 text-white
                  opacity-30 hover:opacity-90
                  transition-all duration-200
                "
              >
                ‹
              </button>
            )}

            {hasNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  w-9 h-9 rounded-full
                  flex items-center justify-center
                  text-3xl leading-none
                  bg-black/40 text-white
                  opacity-30 hover:opacity-90
                  transition-all duration-200
                "
              >
                ›
              </button>
            )}
          </div>

          {/* DETAILS */}
          <div className="w-full md:w-96 p-6 overflow-y-auto max-h-[90vh]">

            <h2 className="text-xl font-semibold text-white mb-4">
              {image.filename}
            </h2>

            {/* AI PROCESSING (OLD) */}
            {isProcessing && (
              <div className="mb-6 p-4 bg-purple-500/10 rounded-xl">
                <div className="flex items-center gap-2 text-purple-300">
                  <Loader className="w-4 h-4 animate-spin" />
                  AI Analyzing…
                </div>
              </div>
            )}

            {/* AI DESCRIPTION (OLD) */}
            {metadata?.description && !isProcessing && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  AI Description
                </h3>
                <p className="text-white text-sm">
                  {metadata.description}
                </p>
              </div>
            )}

            {/* TAGS + TAG EDITING (NEW) */}
            {(metadata?.tags || isEditingTags) && !isProcessing && (
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-semibold text-purple-300">Tags</h3>
                  {!isEditingTags && (
                    <div className="flex gap-2">
                      <button onClick={handleCopyTags}>
                        <Copy className="w-4 h-4 text-purple-400" />
                      </button>
                      <button onClick={() => setIsEditingTags(true)}>
                        <Pencil className="w-4 h-4 text-purple-400" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(isEditingTags ? editedTags : metadata?.tags || []).map(
                    (tag, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full"
                      >
                        {tag}
                        {isEditingTags && (
                          <button onClick={() => handleRemoveTag(tag)}>
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    )
                  )}
                </div>

                {isEditingTags && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tag and press Enter"
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-sm text-white"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveTags}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditedTags(metadata?.tags || []);
                          setIsEditingTags(false);
                        }}
                        className="px-3 py-1 bg-white/10 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DOMINANT COLORS (OLD) */}
            {metadata?.colors?.length > 0 && !isProcessing && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-purple-300 mb-2">
                  Dominant Colors
                </h3>
                <div className="flex gap-2">
                  {metadata.colors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onClose();
                        onColorFilter?.(color);
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIONS (OLD) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
              {!isProcessing && (
                <button
                  onClick={() => {
                    onClose();
                    onFindSimilar?.(image.id);
                  }}
                  className="bg-purple-500 text-white py-2 rounded"
                >
                  Find Similar Images
                </button>
              )}

              <button
                onClick={handleDownload}
                disabled={!image.originalUrl}
                className="bg-white/10 text-white py-2 rounded"
              >
                Download
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500/20 text-red-300 py-2 rounded"
              >
                {deleting ? 'Deleting…' : 'Delete Image'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;














