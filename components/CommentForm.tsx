import React, { useState, useEffect, useRef } from 'react';
import type { Comment } from '../types';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface CommentFormProps {
  postId: number;
  onCommentAdded: (newComment: Comment) => void;
}

const RECAPTCHA_SITE_KEY = '6Lcm1QUsAAAAAP4bS9QiKH9jCpDXQ3ktJsgQwcO4';

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded }) => {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const renderRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.render && recaptchaRef.current && widgetIdRef.current === null) {
        widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => setRecaptchaToken(token),
          'expired-callback': () => setRecaptchaToken(null),
          theme: 'dark'
        });
      }
    };
    
    // Poll for the grecaptcha object to be ready
    const interval = setInterval(() => {
        if (typeof window.grecaptcha !== 'undefined') {
            renderRecaptcha();
            clearInterval(interval);
        }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
        setError('Please complete the reCAPTCHA verification.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, author, text, recaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      
      setSuccess('Thank you! Your comment has been submitted and is awaiting moderation.');
      setAuthor('');
      setText('');
      
      // Reset reCAPTCHA
      if (window.grecaptcha && widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      setRecaptchaToken(null);
      
      onCommentAdded(data);
      
      // Hide success message after a few seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-lg space-y-4">
      <h3 className="text-xl font-bold text-white">Leave a Reply</h3>
      {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}
      {success && <div className="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-md">{success}</div>}

      <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
      </div>
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-300 mb-1">Your Comment</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={5}
          className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div ref={recaptchaRef}></div>
        <button
          type="submit"
          disabled={isLoading || !recaptchaToken}
          className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Submitting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;