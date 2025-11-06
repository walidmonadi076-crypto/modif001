import React, { useEffect, useRef } from 'react';
import { useAds } from '../contexts/AdContext';

interface AdProps {
  placement: 'game_vertical' | 'game_horizontal' | 'shop_square';
}

const Ad: React.FC<AdProps> = ({ placement }) => {
  const { ads, isLoading } = useAds();
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  const ad = ads.find(a => a.placement === placement);

  useEffect(() => {
    if (ad && ad.code && adContainerRef.current) {
      const container = adContainerRef.current;
      container.innerHTML = ad.code;
      
      const scripts = Array.from(container.getElementsByTagName('script'));
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copy content
        newScript.innerHTML = oldScript.innerHTML;

        // Replace old script with new one to trigger execution
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [ad]);

  const getAdDimensions = () => {
    switch (placement) {
      case 'game_vertical':
        return { width: 300, height: 600, text: 'Vertical Ad (300x600)' };
      case 'game_horizontal':
        return { width: 728, height: 90, text: 'Horizontal Ad (728x90)' };
      case 'shop_square':
        return { width: 300, height: 250, text: 'Square Ad (300x250)' };
      default:
        return { width: 300, height: 250, text: 'Ad Placeholder' };
    }
  };

  const { width, height, text } = getAdDimensions();

  if (isLoading) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px` }} 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center animate-pulse"
      >
        <span className="text-gray-500 text-sm font-semibold">Loading Ad...</span>
      </div>
    );
  }

  if (!ad || !ad.code) {
    return (
       <div 
        style={{ width: `${width}px`, height: `${height}px` }} 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
      >
        <span className="text-gray-500 text-sm font-semibold">{text}</span>
      </div>
    );
  }

  return (
    <div 
      ref={adContainerRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="flex items-center justify-center"
    />
  );
};

export default Ad;