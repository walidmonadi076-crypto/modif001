import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import type { Comment } from '../../../types';

const RECAPTCHA_SECRET_KEY = '6Lcm1QUsAAAAAO4ClV3H-_pYeUlNPL-AJhRgwoI9';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Comment | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { postId, author, text, recaptchaToken } = req.body;

  // --- Input Validation ---
  if (!postId || !author || !text) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Please complete the reCAPTCHA.' });
  }
  if (author.trim().length < 2 || author.trim().length > 50) {
    return res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
  }
  if (text.trim().length < 10 || text.trim().length > 1000) {
    return res.status(400).json({ error: 'Comment must be between 10 and 1000 characters.' });
  }

  // --- reCAPTCHA Verification ---
  try {
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const recaptchaRes = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });
    
    const recaptchaJson = await recaptchaRes.json();
    
    if (!recaptchaJson.success) {
      console.warn('reCAPTCHA verification failed:', recaptchaJson['error-codes']);
      return res.status(400).json({ error: 'Failed reCAPTCHA verification. Please try again.' });
    }
  } catch (error) {
    console.error("reCAPTCHA verification request error:", error);
    return res.status(500).json({ error: 'Error verifying reCAPTCHA.' });
  }

  const client = await getDbClient();
  try {
    // --- Database Insertion ---
    const sanitizedAuthor = author.trim();
    const sanitizedText = text.trim();
    const avatarUrl = `https://i.pravatar.cc/40?u=${Date.now()}`; // Simple unique avatar
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const result = await client.query(
      `INSERT INTO comments (blog_post_id, author, avatar_url, date, text, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id, author, avatar_url AS "avatarUrl", date, text`,
      [postId, sanitizedAuthor, avatarUrl, date, sanitizedText]
    );
    const newComment: Comment = result.rows[0];

    return res.status(201).json(newComment);
  } catch (error) {
    console.error("API Error in /api/comments:", error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    client.release();
  }
}