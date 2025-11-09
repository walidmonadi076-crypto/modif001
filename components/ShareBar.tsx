
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ShareBarProps {
  title: string;
  orientation?: 'vertical' | 'horizontal';
}

const socialPlatforms = [
  { name: 'Facebook', label: 'Share', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17 2h-3a5 5 0 0 0-5 5v3H6v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z"/></svg>, color: 'bg-[#1877F2]', shareUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}' },
  { name: 'WhatsApp', label: 'WhatsApp', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 14c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.5-1.8-.2-.3 0-.5.1-.6.1-.1.2-.3.4-.4.1-.1.2-.3.3-.5.1-.2.1-.4 0-.5C10 9.2 9.5 8 9.3 7.5c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.2-.7.4-.2.2-.8.8-.8 2s.8 2.3 1 2.4c.1.2 1.5 2.4 3.7 3.3.5.2.9.3 1.2.4.5.1 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.6.2-1.1.1-1.2s-.2-.2-.4-.3zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18.2c-1.6 0-3.2-.4-4.5-1.2l-4.8 1.3 1.3-4.7c-.8-1.4-1.3-3-1.3-4.6 0-4.5 3.7-8.2 8.2-8.2s8.2 3.7 8.2 8.2-3.6 8.2-8.2 8.2z"/></svg>, color: 'bg-[#25D366]', shareUrl: 'https://api.whatsapp.com/send?text={title}%20{url}' },
  { name: 'LinkedIn', label: 'Share', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-11 6H5v10h3V9m-1.5-2a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3M19 9h-2.5a3.5 3.5 0 0 0-3.5 3.5V19h3v-5.5c0-.83.22-1.5.75-1.5s.75.67.75 1.5V19h3V12.5A3.5 3.5 0 0 0 19 9z"/></svg>, color: 'bg-[#0077B5]', shareUrl: 'https://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}' },
  { name: 'X', label: 'Tweet', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931L18.901 1.153zm-1.61 19.7h2.54l-14.48-18.4h-2.939L17.291 20.853z"/></svg>, color: 'bg-[#000000]', shareUrl: 'https://twitter.com/intent/tweet?url={url}&text={title}' },
  { name: 'Pinterest', label: 'Pin', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312c-.085-.36-.021-.778.158-1.158l1.454-6.13c.245-.98.053-2.016-.628-2.617c-1.042-.924-1.304-2.455-.63-3.61c.646-1.104 2.132-1.766 3.468-1.766c1.67 0 2.943.834 2.943 2.535c0 2.668-1.666 4.545-3.868 4.545c-1.196 0-2.028-.905-1.73-2.023c.27-1.025.86-2.09.86-2.735c0-.785-.43-1.428-1.284-1.428c-1.01 0-1.78.995-1.78 2.378c0 .86.31 1.777.683 2.316c-.237.946-.683 2.21-1.002 3.102c-.22.62-.12.83.04 1.16c.2.4.58.55.88.35c1.474-.95 1.838-3.003 2.296-4.83c.203-.805.787-1.55 1.488-1.55c1.554 0 2.572 1.637 2.572 3.868c0 2.95-1.875 5.06-4.914 5.06c-2.44 0-4.32-1.85-4.32-4.144c0-1.465.8-2.793 1.942-3.52c-.172-1.03-.203-2.14.053-3.13c.265-1.03 1.144-1.53 1.144-1.53c.69-.32 1.48-.05 1.7.35c.18.33.2.78.04 1.2c-.18.42-.35.83-.35 1.254c0 .54.265 1.04 1.002 1.04c1.11 0 2.122-1.378 2.122-3.334c0-1.638-.934-2.825-2.748-2.825c-2.434 0-4.015 1.637-4.015 3.935c0 1.03.35 1.77.35 1.77c-.882 3.334.46 6.32 1.184 7.234Z"/></svg>, color: 'bg-[#E60023]', shareUrl: 'https://pinterest.com/pin/create/button/?url={url}&description={title}' },
];

const ShareBar: React.FC<ShareBarProps> = ({ title, orientation = 'vertical' }) => {
  const router = useRouter();
  const [shareCount, setShareCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, [router.asPath]);

  const handleShare = (shareUrl: string) => {
    const finalUrl = shareUrl
      .replace('{url}', encodeURIComponent(currentUrl))
      .replace('{title}', encodeURIComponent(title));
    window.open(finalUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    setShareCount(prev => prev + 1);
  };

  const isVertical = orientation === 'vertical';

  return (
    <div className={`flex ${isVertical ? 'flex-col items-center gap-3' : 'flex-wrap justify-center gap-4'}`}>
      {isVertical && (
        <div className="flex flex-col items-center text-center text-gray-400 mb-2">
            <span className="font-bold text-2xl text-white">{shareCount}</span>
            <span className="text-xs uppercase tracking-wider">Shares</span>
        </div>
      )}

      {socialPlatforms.map(platform => (
        <button
          key={platform.name}
          onClick={() => handleShare(platform.shareUrl)}
          className={`${platform.color} text-white font-semibold transition-transform hover:scale-110 shadow-lg flex items-center
                      ${isVertical ? 'w-12 h-12 rounded-full justify-center' : 'py-2 px-4 gap-2 rounded-lg'}`}
          aria-label={`Share on ${platform.name}`}
        >
          {platform.icon}
          {!isVertical && (<span className='text-sm'>{platform.label}</span>)}
        </button>
      ))}
    </div>
  );
};

export default ShareBar;