import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import type { Comment } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Comment | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { postId, author, email, phone, text, recaptchaToken } = req.body;

  // --- reCAPTCHA Verification ---
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Please complete the reCAPTCHA.' });
  }
  try {
    const secretKey = '6Lcm1QUsAAAAAO4ClV3H-_pYeUlNPL-AJhRgwoI9';
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${recaptchaToken}`,
    });
    const verificationData = await response.json();
    if (!verificationData.success) {
      return res.status(400).json({ error: 'Failed reCAPTCHA verification.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred during verification.' });
  }

  // --- Input Validation ---
  if (!postId || !author || !text || !email) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (author.trim().length < 2 || author.trim().length > 50) {
    return res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
  }
  if (text.trim().length < 10 || text.trim().length > 1000) {
    return res.status(400).json({ error: 'Comment must be between 10 and 1000 characters.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
  }

  const client = await getDbClient();
  try {
    const sanitizedAuthor = author.trim();
    const sanitizedText = text.trim();
    const avatarUrl = `https://i.pravatar.cc/40?u=${encodeURIComponent(email)}`;
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const result = await client.query(
      `INSERT INTO comments (blog_post_id, author, email, phone, avatar_url, date, text, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') 
       RETURNING id, author, avatar_url AS "avatarUrl", date, text, status, email, phone`,
      [postId, sanitizedAuthor, email, phone || null, avatarUrl, date, sanitizedText]
    );
    const newComment: Comment = result.rows[0];
    
    // La revalidation se fera maintenant via l'API d'administration après approbation
    return res.status(201).json(newComment);
  } catch (error) {
    console.error("API Error in /api/comments:", error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    client.release();
  }
}