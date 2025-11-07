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

  const { postId, author, text, recaptchaToken } = req.body;

  // --- reCAPTCHA Verification ---
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Please complete the reCAPTCHA.' });
  }

  try {
    const secretKey = '6Lcm1QUsAAAAAO4ClV3H-_pYeUlNPL-AJhRgwoI9';
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify`;
    
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${recaptchaToken}`,
    });

    const verificationData = await response.json();

    if (!verificationData.success) {
      console.warn('reCAPTCHA verification failed:', verificationData['error-codes']);
      return res.status(400).json({ error: 'Failed reCAPTCHA verification.' });
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return res.status(500).json({ error: 'An error occurred during verification.' });
  }

  // --- Input Validation ---
  if (!postId || !author || !text) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (author.trim().length < 2 || author.trim().length > 50) {
    return res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
  }
  if (text.trim().length < 10 || text.trim().length > 1000) {
    return res.status(400).json({ error: 'Comment must be between 10 and 1000 characters.' });
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