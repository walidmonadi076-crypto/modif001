import React from 'react';
import Image from 'next/image';
import type { Comment } from '../types';

interface CommentCardProps {
  comment: Comment;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex-shrink-0">
        <Image
          src={comment.avatarUrl}
          alt={comment.author}
          width={40}
          height={40}
          className="rounded-full"
        />
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-white">{comment.author}</p>
          <p className="text-xs text-gray-400">{comment.date}</p>
        </div>
        <p className="mt-1 text-gray-300">{comment.text}</p>
      </div>
    </div>
  );
};

export default CommentCard;
