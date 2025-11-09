"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SocialLinkPreview from './previews/SocialLinkPreview';
import { Game, BlogPost, Product, SocialLink } from '../types';

type PreviewData = Partial<Game> | Partial<BlogPost> | Partial<Product> | Partial<SocialLink>;
type FormType = 'games' | 'blogs' | 'products' | 'social-links';

interface AdminPreviewProps {
  data: PreviewData;
  type: FormType;
}

type Device = 'desktop' | 'tablet' | 'mobile';

const deviceDimensions: Record<Device, { width: number; height: number }> = {
  desktop: { width: 1440, height: 810 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}> = ({ onClick, isActive = false, children, ariaLabel }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-md transition-colors ${
      isActive ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

const AdminPreview: React.FC<AdminPreviewProps> = ({ data, type }) => {
  const [device, setDevice] = useState<Device>('desktop');
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewRootRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const previewPageMap: Partial<Record<FormType, string>> = {
    games: 'game',
    blogs: 'blog',
    products: 'product',
  };

  const previewTarget = previewPageMap[type];

  // This effect now uses a ResizeObserver to accurately calculate the scale
  // whenever the container's size changes, for any reason.
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const calculateScale = () => {
      const { width: deviceWidth, height: deviceHeight } = deviceDimensions[device];
      
      // Give the frame some breathing room inside the container
      const containerWidth = container.offsetWidth - 16;
      const containerHeight = container.offsetHeight - 16;

      if (deviceWidth <= 0 || deviceHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
        setScale(1);
        return;
      }

      const scaleX = containerWidth / deviceWidth;
      const scaleY = containerHeight / deviceHeight;
      
      const newScale = Math.min(scaleX, scaleY, 1); // Never scale up, only down
      setScale(newScale);
    };

    // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" errors
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateScale);
    });
    
    resizeObserver.observe(container);
    
    // Perform initial calculation
    calculateScale();

    // Cleanup observer on unmount or when device changes
    return () => {
      resizeObserver.disconnect();
    };
  }, [device]); // Rerun this entire effect only when the device type changes

  useEffect(() => {
    if (iframeRef.current && iframeLoaded && data && previewTarget) {
      iframeRef.current.contentWindow?.postMessage(
        { type: 'preview-update', payload: data },
        window.location.origin
      );
    }
  }, [data, iframeLoaded, previewTarget]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      previewRootRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const { width: deviceWidth, height: deviceHeight } = deviceDimensions[device];

  return (
    <div ref={previewRootRef} className="bg-gray-900 rounded-lg h-full flex flex-col p-4">
      <div className="flex justify-between items-center gap-2 mb-4 p-2 bg-gray-800 rounded-md">
        <div className="flex items-center gap-2">
           <ToolbarButton onClick={handleRefresh} ariaLabel="Refresh Preview">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4l-5 5M4 20l5-5" /></svg>
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton onClick={() => setDevice('desktop')} isActive={device === 'desktop'} ariaLabel="Switch to desktop preview">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => setDevice('tablet')} isActive={device === 'tablet'} ariaLabel="Switch to tablet preview">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.375-3.375h9.75m-9.75-3h9.75m-9.75-3h9.75m0-3h-9.75M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => setDevice('mobile')} isActive={device === 'mobile'} ariaLabel="Switch to mobile preview">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5h-2.25m-3.75 0h3.75M12 18.75h.008v.008H12v-.008z" /></svg>
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-2">
          <ToolbarButton onClick={handleToggleFullscreen} ariaLabel={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            {isFullscreen ? 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg> : 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
            }
          </ToolbarButton>
        </div>
      </div>
      <div ref={previewContainerRef} className="flex-grow flex items-center justify-center overflow-hidden bg-gray-800 rounded-md p-2">
        <div
          id="preview-frame-container"
          className="shadow-2xl rounded-lg border-2 border-gray-700 ring-1 ring-inset ring-white/5 overflow-hidden transition-all duration-300 ease-in-out bg-gray-900"
          style={{
            width: `${deviceWidth}px`,
            height: `${deviceHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {previewTarget ? (
            <iframe
              ref={iframeRef}
              src={`/admin/previews/${previewTarget}`}
              title={`${previewTarget} Preview`}
              className="w-full h-full"
              onLoad={() => setIframeLoaded(true)}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : type === 'social-links' ? (
            <div className="w-full h-full overflow-y-auto">
                 <SocialLinkPreview data={data as Partial<SocialLink>} />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center text-gray-500">
                Preview not available for this type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPreview;