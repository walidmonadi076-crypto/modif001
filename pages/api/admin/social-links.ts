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
      const result = await client.query('SELECT id, name, url, icon_svg FROM social_links ORDER BY id ASC');
      return res.status(200).json(result.rows);
    }
    
    const { id, name, url, icon_svg } = req.body;
    let processedUrl = url;

    if (req.method === 'POST' || req.method === 'PUT') {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Le champ "Nom" est obligatoire.' });
        }
        if (!url || typeof url !== 'string' || url.trim() === '') {
            return res.status(400).json({ error: 'Une URL valide est obligatoire.' });
        }
        
        // Ajoute automatiquement https:// si le protocole est manquant
        if (!/^https?:\/\//i.test(url)) {
            processedUrl = `https://${url}`;
        }
        
        // Valide le format final de l'URL
        try {
            new URL(processedUrl);
        } catch (_) {
            return res.status(400).json({ error: 'Le format de l\'URL est invalide.' });
        }

        if (!icon_svg || typeof icon_svg !== 'string' || !icon_svg.includes('<svg')) {
            return res.status(400).json({ error: 'Un code SVG valide est obligatoire.' });
        }
    }

    if (req.method === 'POST') {
      const result = await client.query(
        'INSERT INTO social_links (name, url, icon_svg) VALUES ($1, $2, $3) RETURNING *',
        [name, processedUrl, icon_svg]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const result = await client.query(
        'UPDATE social_links SET name = $1, url = $2, icon_svg = $3 WHERE id = $4 RETURNING *',
        [name, processedUrl, icon_svg, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Lien non trouvé' });
      }
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const result = await client.query('DELETE FROM social_links WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Lien non trouvé' });
      }
      return res.status(200).json({ message: 'Lien supprimé' });
    }
    
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error("API Error in /api/admin/social-links:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}