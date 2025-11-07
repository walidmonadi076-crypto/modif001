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
        SELECT c.id, c.author, c.text, c.date, c.status, c.blog_post_id, b.title as blog_title
        FROM comments c
        JOIN blog_posts b ON c.blog_post_id = b.id
        ORDER BY c.id DESC
      `);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      if (!id || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'ID et statut valide requis.' });
      }

      const result = await client.query(
        'UPDATE comments SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Commentaire non trouvé' });
      }

      // Revalidate the blog post page if the comment is approved
      if (status === 'approved') {
        const postResult = await client.query('SELECT slug FROM blog_posts WHERE id = $1', [result.rows[0].blog_post_id]);
        if (postResult.rows.length > 0) {
          await res.revalidate(`/blog/${postResult.rows[0].slug}`);
        }
      }

      return res.status(200).json(result.rows[0]);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const result = await client.query('DELETE FROM comments WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Commentaire non trouvé' });
      }
      return res.status(200).json({ message: 'Commentaire supprimé' });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error("API Error in /api/admin/comments:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}