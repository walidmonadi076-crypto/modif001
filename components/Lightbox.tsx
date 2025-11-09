
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

type MediaItem = {
  type: 'image' | 'video';
  src: string;
};

interface LightboxProps {
  items: MediaItem[];
  startIndex?: number;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ items, startIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : items.length - 1));
  }, [items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex < items.length - 1 ? prevIndex + 1 : 0));
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, goToPrevious, goToNext]);

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full h-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {currentItem.type === 'image' ? (
          <Image
            src={currentItem.src}
            alt={`Lightbox image ${currentIndex + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
          />
        ) : (
          <video
            src={currentItem.src}
            controls
            autoPlay
            className="w-full h-full"
          />
        )}
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl hover:opacity-75 transition-opacity"
        aria-label="Close"
      >
        &times;
      </button>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            aria-label="Next"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  );
};

export default Lightbox;