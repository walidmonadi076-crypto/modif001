import React, { useState, useEffect } from "react";
import type { Comment } from '../types';

declare global {
  interface Window {
    grecaptcha?: any;
    onRecaptchaSuccess?: (token: string) => void;
    onRecaptchaExpired?: () => void;
  }
}

interface CommentFormProps {
  postId: number;
  onCommentAdded: (newComment: Comment) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded }) => {
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    window.onRecaptchaSuccess = (token: string) => setRecaptchaToken(token);
    window.onRecaptchaExpired = () => setRecaptchaToken(null);
    return () => {
      window.onRecaptchaSuccess = undefined;
      window.onRecaptchaExpired = undefined;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!recaptchaToken) {
      setError("⚠️ Please complete the reCAPTCHA verification.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, author, email, phone, text, recaptchaToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setSuccess("✅ Thank you! Your comment is awaiting moderation.");
      setAuthor("");
      setEmail("");
      setPhone("");
      setText("");
      setRecaptchaToken(null);
      window.grecaptcha?.reset();

      onCommentAdded(data);
      setTimeout(() => setSuccess(null), 6000);
    } catch (err) {
      setError((err as Error).message);
      window.grecaptcha?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800 rounded-lg space-y-4 border border-gray-700">
      <h3 className="text-xl font-bold text-white">Leave a Reply</h3>
      {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}
      {success && <div className="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-md">{success}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
          <input id="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone (Optional)</label>
        <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-300 mb-1">Your Comment *</label>
        <textarea id="text" value={text} onChange={(e) => setText(e.target.value)} required rows={5} className="w-full px-3 py-2 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="g-recaptcha" data-sitekey="6Lcm1QUsAAAAAP4bS9QiKH9jCpDXQ3ktJsgQwcO4" data-callback="onRecaptchaSuccess" data-expired-callback="onRecaptchaExpired" data-theme="dark"></div>
        <button type="submit" disabled={isLoading || !recaptchaToken} className="px-6 py-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
          {isLoading ? "Submitting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;