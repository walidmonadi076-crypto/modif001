import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const client = await getDbClient();

  try {
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT 
          c.id, c.author, c.text, c.email, c.phone, c.status, c.blog_post_id,
          b.title AS blog_title
        FROM comments c
        LEFT JOIN blog_posts b ON c.blog_post_id = b.id
        ORDER BY c.id DESC
      `);
      return res.status(200).json(result.rows);
    }
    
    if (req.method === 'PUT') { // Approve a comment
      const { id } = req.body;
      if (!id) return res.status(400).json({ message: 'Comment ID is required.' });

      await client.query('BEGIN');

      const updateResult = await client.query(
        "UPDATE comments SET status = 'approved' WHERE id = $1 RETURNING blog_post_id",
        [id]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Comment not found.' });
      }
      
      const { blog_post_id } = updateResult.rows[0];
      const postResult = await client.query('SELECT slug FROM blog_posts WHERE id = $1', [blog_post_id]);
      
      await client.query('COMMIT');
      
      // Trigger revalidation after committing the transaction
      if (postResult.rows.length > 0) {
        const slug = postResult.rows[0].slug;
        try {
          await res.revalidate(`/blog/${slug}`);
          return res.status(200).json({ success: true, message: 'Comment approved and page revalidated.' });
        } catch (err) {
          console.error('Error revalidating page:', err);
          return res.status(500).json({ message: 'Comment approved, but page revalidation failed.' });
        }
      }
      
      return res.status(200).json({ success: true, message: 'Comment approved.' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const result = await client.query('DELETE FROM comments WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      return res.status(200).json({ message: 'Comment deleted successfully' });
    }
    
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("API Error in /api/admin/comments:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}