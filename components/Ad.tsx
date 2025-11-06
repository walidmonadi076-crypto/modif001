import React from 'react';
import { useAds } from '../contexts/AdContext';

interface AdProps {
  placement: 'game_vertical' | 'game_horizontal' | 'shop_square' | 'blog_skyscraper_left' | 'blog_skyscraper_right';
}

const Ad: React.FC<AdProps> = ({ placement }) => {
  const { ads, isLoading } = useAds();
  
  const ad = ads.find(a => a.placement === placement);

  const getAdDimensions = () => {
    switch (placement) {
      case 'game_vertical':
        return { width: 300, height: 600, text: 'Vertical Ad (300x600)' };
      case 'game_horizontal':
        return { width: 728, height: 90, text: 'Horizontal Ad (728x90)' };
      case 'shop_square':
        return { width: 300, height: 250, text: 'Square Ad (300x250)' };
      case 'blog_skyscraper_left':
      case 'blog_skyscraper_right':
        return { width: 160, height: 600, text: 'Skyscraper Ad (160x600)' };
      default:
        return { width: 300, height: 250, text: 'Ad Placeholder' };
    }
  };

  const { width, height, text } = getAdDimensions();

  // Loading state placeholder
  if (isLoading) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }} 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center animate-pulse"
      >
        <span className="text-gray-500 text-sm font-semibold">Loading Ad...</span>
      </div>
    );
  }

  // If no ad code is available, show a placeholder
  if (!ad || !ad.code) {
    return (
       <div 
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }} 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
      >
        <span className="text-gray-500 text-sm font-semibold">{text}</span>
      </div>
    );
  }

  // The iframe component that isolates the ad code
  return (
    <iframe
      title={`Ad for ${placement}`}
      srcDoc={`
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; overflow: hidden; }
              * { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${ad.code}
          </body>
        </html>
      `}
      width={width}
      height={height}
      style={{ maxWidth: '100%', border: 'none' }}
      sandbox="allow-scripts allow-same-origin" // Security sandbox
      scrolling="no"
    />
  );
};

export default Ad;