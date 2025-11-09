
import React from 'react';
import Image from 'next/image';
import { BlogPost } from '../../types';
import StarRating from '../StarRating';

interface BlogPreviewProps {
  data: Partial<BlogPost>;
}

const BlogPreview: React.FC<BlogPreviewProps> = ({ data }) => {
  const {
    title = 'Your Awesome Blog Post Title',
    author = 'Your Name',
    publishDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    imageUrl = 'https://picsum.photos/seed/blog-placeholder/800/450',
    content = '<p>Your blog content will appear here. You can use <strong>HTML</strong> for formatting.</p><p>Add images, lists, and more to make your post engaging!</p>',
    rating = 4.5,
  } = data;
  
  const displayImageUrl = imageUrl || 'https://picsum.photos/seed/blog-placeholder/800/450';

  return (
    <div className="animate-fade-in">
        <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{title}</h1>
            <div className="flex items-center text-sm text-gray-400">
                <span>By {author}</span><span className="mx-2">&bull;</span><span>Published on {publishDate}</span>
            </div>
        </header>

        <StarRating rating={rating || 0} size="large" className="mb-6" />

        <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-lg relative">
            <Image src={displayImageUrl} alt={title || 'Blog Preview'} key={displayImageUrl} fill sizes="100vw" className="object-cover" />
        </div>
        
        <article className="prose prose-invert prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default BlogPreview;
