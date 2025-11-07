import React, { useState, useEffect } from 'react';

interface CommentFormProps {
  postId: number;
  onCommentAdded: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded }) => {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    generateNewQuestion();
  }, []);

  const generateNewQuestion = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, author, text, num1, num2, answer }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      
      setSuccess('Thank you! Your comment has been submitted.');
      setAuthor('');
      setText('');
      setAnswer('');
      generateNewQuestion();
      onCommentAdded();
      
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="verification" className="block text-sm font-medium text-gray-300 mb-1">
                Human Verification: What is {num1} + {num2}?
            </label>
            <input
                id="verification"
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
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
      <div className="text-right">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Submitting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
