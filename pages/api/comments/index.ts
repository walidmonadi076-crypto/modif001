import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import type { Comment } from '../../../types';

// Simple in-memory rate limiter to prevent spam
const rateLimiter = new Map<string, { count: number; expiry: number }>();
const MAX_REQUESTS = 3; // Max 3 comments per IP
const WINDOW_DURATION = 10 * 60 * 1000; // in a 10 minute window

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Comment | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // --- Rate Limiting Logic ---
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimiter.get(ip);

  if (record && now < record.expiry) {
    if (record.count >= MAX_REQUESTS) {
      return res.status(429).json({ error: 'Too many comments. Please try again in a few minutes.' });
    }
    rateLimiter.set(ip, { ...record, count: record.count + 1 });
  } else {
    // Start a new record for this IP
    rateLimiter.set(ip, { count: 1, expiry: now + WINDOW_DURATION });
  }
  
  // --- Input Validation & Human Verification ---
  const { postId, author, text, num1, num2, answer } = req.body;

  if (!postId || !author || !text || !answer || num1 === undefined || num2 === undefined) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (author.trim().length < 2 || author.trim().length > 50) {
    return res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
  }
  if (text.trim().length < 10 || text.trim().length > 1000) {
    return res.status(400).json({ error: 'Comment must be between 10 and 1000 characters.' });
  }
  if (parseInt(answer, 10) !== num1 + num2) {
      return res.status(400).json({ error: 'Incorrect answer to the human verification question.' });
  }

  const client = await getDbClient();
  try {
    // --- Database Insertion ---
    const sanitizedAuthor = author.trim();
    const sanitizedText = text.trim();
    const avatarUrl = `https://i.pravatar.cc/40?u=${Date.now()}`; // Simple unique avatar
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const result = await client.query(
      `INSERT INTO comments (blog_post_id, author, avatar_url, date, text) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, author, avatar_url AS "avatarUrl", date, text`,
      [postId, sanitizedAuthor, avatarUrl, date, sanitizedText]
    );
    const newComment: Comment = result.rows[0];

    // --- On-Demand Revalidation ---
    // After a successful comment, we trigger a rebuild of the static blog page.
    try {
        const postResult = await client.query('SELECT slug FROM blog_posts WHERE id = $1', [postId]);
        if (postResult.rows.length > 0) {
            const slug = postResult.rows[0].slug;
            await res.revalidate(`/blog/${slug}`);
        }
    } catch (revalError) {
        // Log the error but don't fail the request, the standard revalidation will still run.
        console.error('Error triggering revalidation:', revalError);
    }

    return res.status(201).json(newComment);
  } catch (error) {
    console.error("API Error in /api/comments:", error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    client.release();
  }
}
