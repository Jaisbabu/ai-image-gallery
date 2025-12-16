import React, { useState, useEffect } from 'react';
import { Loader, Sparkles, ImageOff } from 'lucide-react';

const ImageGrid = ({ images, loading, onImageClick, emptyState }) => {
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-4 max-w-7xl mx-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square w-[260px] bg-white/5 rounded-xl animate-pulse border border-white/10"
            />
          ))}
        </div>
      </div>
    );
  }


  // 2️⃣ No images → render NOTHING (Gallery handles empty UI)
    if (!images || images.length === 0) {
    return null;
    }



  return (
    <div className="flex justify-center">
      <div className="flex flex-wrap justify-center gap-4 max-w-7xl mx-auto">
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onClick={() => onImageClick(image)}
          />
        ))}
      </div>
    </div>
  );
};

const ImageCard = ({ image, onClick }) => {
  const metadata = image.metadata;
  const isProcessing =
    metadata?.ai_processing_status === 'pending' ||
    metadata?.ai_processing_status === 'processing';

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [image.thumbnailUrl, image.id]);

  const canShowImage = Boolean(image.thumbnailUrl) && !imgError;

  const safeThumbnailUrl = image.thumbnailUrl
    ? `${image.thumbnailUrl}${image.thumbnailUrl.includes('?') ? '&' : '?'}v=${image.id}`
    : null;

  return (
    <div
      onClick={onClick}
      className="
        group relative aspect-square w-[260px]
        rounded-xl overflow-hidden cursor-pointer
        bg-white/5 border border-white/10
        transition-all duration-300 ease-out
        hover:border-purple-400/50
        hover:scale-[1.02]
        hover:shadow-xl hover:shadow-purple-500/10
      "
    >
      {canShowImage ? (
        <img
          src={safeThumbnailUrl}
          alt={image.filename}
          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/30">
          <ImageOff className="w-10 h-10 text-purple-300 opacity-70" />
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <Loader className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-purple-200">AI analyzing...</p>
        </div>
      )}
    </div>
  );
};

export default ImageGrid;

















