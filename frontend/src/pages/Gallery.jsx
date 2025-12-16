import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { LogOut, ImagePlus, Upload, ArrowLeft, Sparkles } from 'lucide-react';

import ImageGrid from '../components/ImageGrid.jsx';
import ImageModal from '../components/ImageModal.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Gallery = () => {
  const { user, signOut } = useAuth();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  // new
  const [inputValue, setInputValue] = useState('');




  const [searchMode, setSearchMode] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [showUpload, setShowUpload] = useState(false);

  const pollingRef = useRef(null);
  const searchAbortRef = useRef(null);

  /* ------------------ LOAD IMAGES ------------------ */
  const loadImages = async (page = 1) => {
    try {
      const result = await api.getImages(page);
      setImages(result.images);
      setPagination(result.pagination);
    } catch {
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ SEARCH EFFECT ------------------ */

useEffect(() => {
  if (searchAbortRef.current) {
    searchAbortRef.current.abort();
  }

  const controller = new AbortController();
  searchAbortRef.current = controller;

  const run = async () => {
    // 🚫 These modes are handled elsewhere
    if (searchMode === 'similar' || searchMode === 'color') {
      setLoading(false);
      return;
    }

    // 🚫 Strict mode needs at least 3 chars
    if (searchMode === 'strict' && searchQuery.length < 3) {
      setLoading(false);
      return;
    }

    // 🚫 Any search needs at least 2 chars
    if (searchMode && searchQuery.length < 2) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 🖼️ GALLERY MODE
      if (!searchMode) {
        const result = await api.getImages(
          currentPage,
          20,
          { signal: controller.signal }
        );

        setImages(result.images);
        setPagination(result.pagination);
        return;
      }

      // 🔍 SEARCH MODE
      if (searchMode === 'loose' || searchMode === 'strict') {
        const result = await api.searchByText(
          searchQuery,
          currentPage,
          20,
          { signal: controller.signal, mode: searchMode }
        );

        if (!result) return;

        setImages(result.images || []);
        setPagination(result.pagination || null);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Search failed');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  run();
  return () => controller.abort();
}, [searchMode, searchQuery, currentPage]);


  /* ------------------ AUTO REFRESH ------------------ */

useEffect(() => {
    if (searchMode) return;

    const shouldPoll = images.some(
      img => img?.metadata?.ai_processing_status === 'processing'
    );

    if (!shouldPoll) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => loadImages(currentPage), 4000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [images, searchMode, currentPage]);



  // useEffect(() => {
  //   if (searchMode) return;

  //   const shouldPoll = images.some(
  //     img => img?.metadata?.ai_processing_status === 'processing'
  //   );

  //   if (!shouldPoll) {
  //     if (pollingRef.current) {
  //       clearInterval(pollingRef.current);
  //       pollingRef.current = null;
  //     }
  //     return;
  //   }

  //   if (!pollingRef.current) {
  //     pollingRef.current = setInterval(() => loadImages(currentPage), 4000);
  //   }

  //   return () => {
  //     if (pollingRef.current) {
  //       clearInterval(pollingRef.current);
  //       pollingRef.current = null;
  //     }
  //   };
  // }, [images, searchMode, currentPage]);


  /* ------------------ SEARCH HANDLERS ------------------ */



  const handleSearchInput = (value) => {
  setInputValue(value);

  const trimmed = value.replace(/\s+/g, ' ').trim();

  // Clear → back to gallery
  if (trimmed === '') {
    setSearchQuery('');
    setSearchMode(null);
    setCurrentPage(1);
    return;
  }

  // Typing → ALWAYS loose
  if (trimmed.length >= 2) {
    setSearchQuery(trimmed);
    setSearchMode('loose');
    setCurrentPage(1);
  }
};


  const handleFindSimilar = async (imageId) => {
    setLoading(true);
    setSearchMode('similar');

    try {
      const result = await api.findSimilar(imageId);
      setImages(result.images);
      setPagination(null);
    } catch {
      toast.error('Failed to find similar images');
      loadImages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleTagsUpdated = (imageId, tags) => {
  setImages(prev =>
    prev.map(img =>
      img.id === imageId
        ? {
            ...img,
            metadata: {
              ...img.metadata,
              tags
            }
          }
        : img
    )
  );
  };

  const handleColorFilter = async (color) => {
    setImages([]);
    setPagination(null);
    setLoading(true);
    setSearchMode('color');
    setSearchQuery(color);
    setCurrentPage(1);

    try {
      const result = await api.filterByColor(color);
      setImages(result.images);
      setPagination(result.pagination);
    } catch {
      toast.error('Color filter failed');
      loadImages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    setSelectedIndex(null);
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    setImages([]);
    setSearchMode(null);
    setSearchQuery('');
    setCurrentPage(1);
    loadImages(1);
  };



    // Debounce effect New
useEffect(() => {
  if (searchMode !== 'loose') return;
  if (searchQuery.length < 2) return;

  const timer = setTimeout(() => {
    setSearchMode('strict');
  }, 800);

  return () => clearTimeout(timer);
}, [searchQuery, searchMode]);


  /* ------------------ BACK TO GALLERY ------------------ */
  const handleBackToGallery = () => {
    setInputValue('');
    setSearchQuery('');
    setSearchMode(null);
    setCurrentPage(1);
  };

  /* ------------------ MODAL NAVIGATION ------------------ */
  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      setSelectedIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(i => i - 1);
    }
  };

 /* ------------------ RENDER EMPTY ------------------ */


  const renderEmptyState = () => {
  let title = 'No images yet';
  let description =
    'Upload your first images to generate AI tags, colors, and searchable descriptions.';

  if (searchMode === 'similar') {
    title = 'No similar images';
    description = 'This image does not share tags or colors with others.';
  }

  if (searchMode === 'color') {
    title = 'No images found';
    description = 'No images match the selected color.';
  }

  if (searchMode === 'loose' || searchMode === 'strict') {
    title = 'No matching images';
    description = 'Try a different keyword or phrase.';
  }

  return (
    <div className="flex justify-center py-24">
      <div className="text-center max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/10 rounded-full mb-5">
          <Sparkles className="w-10 h-10 text-purple-400" />
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">
          {title}
        </h3>

        <p className="text-purple-200 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};




  /* ------------------ RENDER ------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      <header className="sticky top-0 z-40 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <ImagePlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Gallery</h1>
              <p className="text-xs text-purple-300">{images.length} images</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
  {user?.email && (
    <span className="text-sm text-purple-200 truncate max-w-[200px]">
      {user.email}
    </span>
  )}

  <button
    onClick={signOut}
    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition"
  >
    <LogOut className="w-4 h-4" />
    Sign Out
  </button>
</div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Search + Upload */}
        <div className="mb-14 flex flex-col items-center gap-6">
          <div className="w-full max-w-2xl">
            <SearchBar value={inputValue} onChange={handleSearchInput} />
          </div>

          <button
            onClick={() => setShowUpload(v => !v)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600/90 hover:bg-purple-600 text-white rounded-xl shadow-lg transition"
          >
            <Upload className="w-4 h-4" />
            {showUpload ? 'Close upload' : 'Upload images'}
          </button>
        </div>


        {/* 🔙 Back to Gallery */}
          {searchMode && (
            <div className="mb-6">
              <button
                onClick={handleBackToGallery}
                className="flex items-center gap-2 text-sm text-purple-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Gallery
              </button>
             </div>
          )}




      
        {showUpload && (
          <div className="mb-14">
            <ImageUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}



        <div className={showUpload ? 'opacity-60 pointer-events-none' : ''}>
  {!loading && images.length === 0 ? (
    renderEmptyState()
  ) : (
    <ImageGrid
      images={images}
      loading={loading}
      onImageClick={(img) =>
        setSelectedIndex(images.findIndex(i => i.id === img.id))
      }
      emptyState={renderEmptyState()}
    />
    
  )}
</div>


      </main>

      {selectedIndex !== null && images[selectedIndex] && (
        <ImageModal
          image={images[selectedIndex]}
          onClose={() => setSelectedIndex(null)}
          onDelete={handleImageDelete}
          onFindSimilar={handleFindSimilar}
          onColorFilter={handleColorFilter}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={selectedIndex < images.length - 1}
          hasPrev={selectedIndex > 0}
          onTagsUpdated={handleTagsUpdated}
        />
      )}
    </div>
  );
};

export default Gallery;











