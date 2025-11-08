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
  const style = { width: `${width}px`, height: `${height}px`, maxWidth: '100%' };

  // Loading state placeholder
  if (isLoading) {
    return (
      <div 
        style={style} 
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
        style={style} 
        className="bg-surface-alt/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center"
      >
        <span className="text-muted text-sm font-semibold">{text}</span>
      </div>
    );
  }
  
  // Reverting to dangerouslySetInnerHTML to avoid iframe sandboxing issues
  // that cause 403 errors with certain ad networks. This approach ensures
  // the ad script runs in the expected environment.
  return (
    <div
      style={{ ...style, display: 'inline-block', verticalAlign: 'middle' }}
      dangerouslySetInnerHTML={{ __html: ad.code }}
    />
  );
};

export default Ad;
