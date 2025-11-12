"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAds } from '../contexts/AdContext';

interface AdProps {
  placement: 'game_vertical' | 'game_horizontal' | 'shop_square' | 'blog_skyscraper_left' | 'blog_skyscraper_right';
}

const Ad: React.FC<AdProps> = ({ placement }) => {
  const { ads, isLoading } = useAds();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isIframe, setIsIframe] = useState(false);
  
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
    // Check if running in an iframe, but only on the client side to avoid SSR issues.
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setIsIframe(true);
    }
  }, []);
  
  useEffect(() => {
    if (ad?.code && adContainerRef.current && !isIframe) {
      const container = adContainerRef.current;
      container.innerHTML = ''; // Clear previous ad content

      // Use a temporary element to parse the HTML string. This allows us to handle
      // all nodes (not just scripts) in the ad code snippet.
      const tempEl = document.createElement('div');
      tempEl.innerHTML = ad.code;

      // The main reason for this logic is that scripts inserted via innerHTML do not execute.
      // We must find all script tags, create new executable script elements, and append them.
      tempEl.childNodes.forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const script = document.createElement('script');
          const oldScript = node as HTMLScriptElement;
          
          // Copy all attributes (like src, type, etc.) from the original script tag
          for (let i = 0; i < oldScript.attributes.length; i++) {
            const attr = oldScript.attributes[i];
            script.setAttribute(attr.name, attr.value);
          }
          
          // Ensure the script can be executed and prevent race conditions for some ad networks
          script.async = false;
          
          // Copy the script's content (for inline scripts)
          script.innerHTML = oldScript.innerHTML;
          
          container.appendChild(script);
        } else {
          // For all other nodes (like divs, iframes, styles), just clone and append
          container.appendChild(node.cloneNode(true));
        }
      });
    }
  }, [ad, isIframe]);

  if (isIframe) {
    return (
      <div 
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }} 
        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
      >
        <span className="text-gray-500 text-sm font-semibold text-center p-2">Ad disabled in preview</span>
      </div>
    );
  }

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

  // Render the container div for the script injection. If no ad code is available,
  // the useEffect hook won't run, and we'll show a placeholder inside this div.
  return (
    <div 
      ref={adContainerRef} 
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      className="ad-container"
    >
      {(!ad || !ad.code) && (
        <div 
          style={{ width: '100%', height: '100%' }} 
          className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
        >
          <span className="text-gray-500 text-sm font-semibold">{text}</span>
        </div>
      )}
    </div>
  );
};

export default Ad;