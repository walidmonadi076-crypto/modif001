import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';
import { slugify } from '../../../lib/slugify';

async function generateUniqueSlug(client: any, title: string, currentId: number | null = null): Promise<string> {
  let baseSlug = slugify(title);
  let slug = baseSlug;
  let isUnique = false;
  let counter = 1;

  while (!isUnique) {
    const query = currentId 
      ? 'SELECT id FROM games WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM games WHERE slug = $1';
    
    const params = currentId ? [slug, currentId] : [slug];
    
    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const client = await getDbClient();

  try {
    if (req.method === 'POST') {
      const { title, imageUrl, category, tags, theme, description, videoUrl, downloadUrl, gallery } = req.body;
      if (!title) return res.status(400).json({ error: 'Le champ "Titre" est obligatoire.' });

      const slug = await generateUniqueSlug(client, title);
      const result = await client.query(
        `INSERT INTO games (title, slug, image_url, category, tags, theme, description, video_url, download_url, gallery) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [title, slug, imageUrl, category, tags || [], theme || null, description, videoUrl || null, downloadUrl || '#', gallery || []]
      );
      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const { id, title, imageUrl, category, tags, theme, description, videoUrl, downloadUrl, gallery } = req.body;
      if (!title) return res.status(400).json({ error: 'Le champ "Titre" est obligatoire.' });
      
      const slug = await generateUniqueSlug(client, title, id);
      const result = await client.query(
        `UPDATE games 
         SET title = $1, slug = $2, image_url = $3, category = $4, tags = $5, theme = $6, description = $7, video_url = $8, download_url = $9, gallery = $10 
         WHERE id = $11 RETURNING *`,
        [title, slug, imageUrl, category, tags || [], theme || null, description, videoUrl || null, downloadUrl || '#', gallery || [], id]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Game not found' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      const result = await client.query('DELETE FROM games WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Game not found' });
      } else {
        res.status(200).json({ message: 'Game deleted successfully' });
      }
    } else {
      res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error("API Error in /api/admin/games:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}