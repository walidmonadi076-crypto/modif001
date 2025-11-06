import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const client = await getDbClient();

  try {
    const { id, title, imageUrl, category, tags, theme, description, videoUrl, downloadUrl, gallery } = req.body;
    
    // Validation stricte des données pour POST et PUT
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: 'Le champ "Titre" est obligatoire.' });
        }
        if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
            return res.status(400).json({ error: 'Le champ "URL de l\'image" est obligatoire.' });
        }
        if (!category || typeof category !== 'string' || category.trim() === '') {
            return res.status(400).json({ error: 'Le champ "Catégorie" est obligatoire.' });
        }
        if (!description || typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ error: 'Le champ "Description" est obligatoire.' });
        }
    }
    
    // Nettoyage et préparation des données
    const safeTags = Array.isArray(tags) ? tags.filter(t => typeof t === 'string' && t.trim() !== '') : [];
    const safeGallery = Array.isArray(gallery) ? gallery.filter(g => typeof g === 'string' && g.trim() !== '') : [];
    const safeTheme = theme || null;
    const safeVideoUrl = videoUrl || null;
    const safeDownloadUrl = downloadUrl || '#';


    if (req.method === 'POST') {
      const result = await client.query(
        `INSERT INTO games (title, image_url, category, tags, theme, description, video_url, download_url, gallery) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [title, imageUrl, category, safeTags, safeTheme, description, safeVideoUrl, safeDownloadUrl, safeGallery]
      );
      
      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const result = await client.query(
        `UPDATE games 
         SET title = $1, image_url = $2, category = $3, tags = $4, theme = $5, description = $6, video_url = $7, download_url = $8, gallery = $9 
         WHERE id = $10 RETURNING *`,
        [title, imageUrl, category, safeTags, safeTheme, description, safeVideoUrl, safeDownloadUrl, safeGallery, id]
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
