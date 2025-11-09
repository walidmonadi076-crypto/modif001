import React, { useEffect, useRef } from 'react';
import { useAds } from '../contexts/AdContext';

interface AdProps {
  placement: 'game_vertical' | 'game_horizontal' | 'shop_square' | 'blog_skyscraper_left' | 'blog_skyscraper_right';
}

const Ad: React.FC<AdProps> = ({ placement }) => {
  const { ads, isLoading } = useAds();
  const adContainerRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    const container = adContainerRef.current;
    // Only run if the container exists and we have ad code to inject.
    if (!container || !ad?.code) {
      return;
    }

    // Set the innerHTML. This will render non-script tags but not execute scripts.
    container.innerHTML = ad.code;

    // Find all the script tags that were injected.
    const scripts = Array.from(container.getElementsByTagName('script'));
    scripts.forEach(oldScript => {
      // To execute the script, we need to create a new script element.
      const newScript = document.createElement('script');
      
      // Copy all attributes from the original script to the new one.
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy the inline script content.
      newScript.text = oldScript.text;
      
      // Replace the old, non-executable script with the new, executable one.
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // Cleanup function: remove the ad content when the component unmounts or the ad code changes.
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [ad?.code]); // The effect depends on the ad code.

  const adDimensionsStyle = { width: `${width}px`, height: `${height}px`, maxWidth: '100%' };

  // Display a loading placeholder while fetching ads.
  if (isLoading) {
    return (
      <div 
        style={adDimensionsStyle} 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center animate-pulse"
      >
        <span className="text-gray-500 text-sm font-semibold">Loading Ad...</span>
      </div>
    );
  }

  // If there's no ad code for this placement, show a static placeholder.
  if (!ad || !ad.code) {
    return (
       <div 
        style={adDimensionsStyle} 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
      >
        <span className="text-gray-500 text-sm font-semibold">{text}</span>
      </div>
    );
  }
  
  // If an ad code exists, render the container that the useEffect will populate.
  return <div ref={adContainerRef} style={adDimensionsStyle} />;
};

export default Ad;