
import React from 'react';
import Image from 'next/image';
import { Game } from '../../types';

interface GamePreviewProps {
  data: Partial<Game>;
}

const GamePreview: React.FC<GamePreviewProps> = ({ data }) => {
  const {
    title = 'Your Game Title',
    imageUrl = 'https://picsum.photos/seed/placeholder/800/600',
    description = 'This is where the description of your amazing game will appear. Keep it short, sweet, and engaging to attract players.',
    tags = ['New', 'Action'],
    gallery = [],
  } = data;

  const displayImageUrl = imageUrl || 'https://picsum.photos/seed/placeholder/800/600';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="aspect-video bg-black relative w-full">
          <Image src={displayImageUrl} alt={title || 'Game Preview'} key={displayImageUrl} fill sizes="100vw" className="object-cover" />
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-extrabold text-white mb-3">{title}</h1>
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map(tag => (
              <span key={tag} className="text-xs font-semibold bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
      </div>
      {gallery && gallery.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Screenshots</h3>
            <div className="grid grid-cols-2 gap-4">
                {gallery.map((img, index) => (
                    <div key={index} className="relative rounded-lg object-cover aspect-video overflow-hidden">
                        <Image src={img} alt={`${title} screenshot ${index + 1}`} fill sizes="50vw" className="object-cover" />
                    </div>
                ))}
            </div>
          </div>
      )}
    </div>
  );
};

export default GamePreview;
