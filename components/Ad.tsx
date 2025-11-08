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
        className="bg-surface-alt/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center animate-pulse"
      >
        <span className="text-muted text-sm font-semibold">Loading Ad...</span>
      </div>
    );
  }

  // If no ad code is available, show a placeholder
  if (!ad || !ad.code) {
    return (
       <div 
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }} 
        className="bg-surface-alt/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center"
      >
        <span className="text-muted text-sm font-semibold">{text}</span>
      </div>
    );
  }
  
  // Create the full HTML content for the iframe's srcDoc.
  // This isolates the ad script in its own environment.
  const iframeContent = `
    <html>
      <head>
        <style>body { margin: 0; padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }</style>
      </head>
      <body>
        ${ad.code}
      </body>
    </html>
  `;

  return (
    <iframe
      title={`Ad for ${placement}`}
      width={width}
      height={height}
      style={{ border: 'none', maxWidth: '100%', verticalAlign: 'middle' }}
      srcDoc={iframeContent}
      // Sandboxing the iframe for security. These permissions are often required by ad networks.
      // `allow-scripts` is needed to run the ad.
      // `allow-same-origin` is often needed for the script's internal logic.
      // The other permissions allow for proper ad functionality like clicks and forms.
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
    />
  );
};

export default Ad;
