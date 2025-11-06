import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const client = await getDbClient();

  try {
    const { id, title, summary, imageUrl, videoUrl, author, publishDate, rating, affiliateUrl, content, category } = req.body;
    
    // Data sanitization and validation
    const numericRating = parseFloat(rating) || 0;
    const safeVideoUrl = videoUrl || null;
    const safeAffiliateUrl = affiliateUrl || null;
    const safePublishDate = publishDate || new Date().toISOString().split('T')[0];


    if (req.method === 'POST') {
      const result = await client.query(
        `INSERT INTO blog_posts (title, summary, image_url, video_url, author, publish_date, rating, affiliate_url, content, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [title, summary, imageUrl, safeVideoUrl, author, safePublishDate, numericRating, safeAffiliateUrl, content, category]
      );
      
      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const result = await client.query(
        `UPDATE blog_posts 
         SET title = $1, summary = $2, image_url = $3, video_url = $4, author = $5, publish_date = $6, rating = $7, affiliate_url = $8, content = $9, category = $10 
         WHERE id = $11 RETURNING *`,
        [title, summary, imageUrl, safeVideoUrl, author, safePublishDate, numericRating, safeAffiliateUrl, content, category, id]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Blog post not found' });
      } else {
        res.status(200).json(result.rows[0]);
      }

    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      const result = await client.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Blog post not found' });
      } else {
        res.status(200).json({ message: 'Blog post deleted successfully' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error("API Error in /api/admin/blogs:", error);
    res.status(500).json({ error: (error as Error).message });
  } finally {
     client.release();
  }
}