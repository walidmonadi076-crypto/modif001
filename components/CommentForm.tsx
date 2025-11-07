import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaSuccess: (token: string) => void;
    onRecaptchaExpired: () => void;
  }
}

interface CommentFormProps {
  postId: number;
  onCommentAdded: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded }) => {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // These functions need to be on the window object for the reCAPTCHA data-callback to work
    window.onRecaptchaSuccess = (token: string) => {
      setRecaptchaToken(token);
    };
    window.onRecaptchaExpired = () => {
      setRecaptchaToken(null);
    };

    return () => {
      // Clean up the global functions when the component unmounts
      delete window.onRecaptchaSuccess;
      delete window.onRecaptchaExpired;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      setIsLoading(false);
      return;
    }

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
      
      setSuccess('Thank you! Your comment has been submitted.');
      setAuthor('');
      setText('');
      
      // Reset reCAPTCHA and token state
      window.grecaptcha?.reset();
      setRecaptchaToken(null);

      onCommentAdded();
      
      // Hide success message after a few seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      setError((err as Error).message);
      // Also reset reCAPTCHA on error
      window.grecaptcha?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-lg space-y-4">
      <h3 className="text-xl font-bold text-white">Leave a Reply</h3>
      {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}
      {success && <div className="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-md">{success}</div>}

      <div className="grid grid-cols-1">
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
        <div 
            className="g-recaptcha"
            data-sitekey="6Lcm1QUsAAAAAP4bS9QiKH9jCpDXQ3ktJsgQwcO4"
            data-callback="onRecaptchaSuccess"
            data-expired-callback="onRecaptchaExpired"
            data-theme="dark"
        ></div>

        <button
          type="submit"
          disabled={isLoading || !recaptchaToken}
          className="px-6 py-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Submitting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;