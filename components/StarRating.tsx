import React from 'react';

interface StarRatingProps {
  rating: number;
  className?: string;
  size?: 'small' | 'large';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, className = '', size = 'small' }) => {
    const numericRating = Number(rating || 0);
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    const starSize = size === 'large' ? 'w-5 h-5' : 'w-4 h-4';
    const textSize = size === 'large' ? 'text-lg' : 'text-sm';

    return (
        <div className={`flex items-center text-yellow-400 ${className}`}>
            {[...Array(fullStars)].map((_, i) => (
                <svg key={`full-${i}`} className={`${starSize} fill-current`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
            ))}
            {halfStar && (
                <svg className={`${starSize} fill-current`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545zM10 12.83V2.5l1.837 3.718 4.108.597-2.973 2.898.702 4.09L10 12.83z"/>
                </svg>
            )}
            {[...Array(emptyStars)].map((_, i) => (
                <svg key={`empty-${i}`} className={`${starSize} fill-current text-gray-600`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
            ))}
            <span className={`ml-2 text-gray-400 ${textSize}`}>
                {numericRating.toFixed(1)}
            </span>
        </div>
    );
};

export default StarRating;
