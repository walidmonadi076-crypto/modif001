import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await getDbClient();

  try {
     if (req.method === 'GET') {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;

      let whereClause = '';
      const queryParams: any[] = [];
      if (search) {
        queryParams.push(`%${search}%`);
        whereClause = `WHERE name ILIKE $${queryParams.length}`;
      }
      
      const totalResult = await client.query(`SELECT COUNT(*) FROM social_links ${whereClause}`, queryParams);
      const totalItems = parseInt(totalResult.rows[0].count, 10);
      const totalPages = Math.ceil(totalItems / limit);

      queryParams.push(limit, offset);
      const itemsResult = await client.query(`
        SELECT id, name, url, icon_svg
        FROM social_links
        ${whereClause}
        ORDER BY id DESC
        LIMIT $${queryParams.length-1} OFFSET $${queryParams.length}
      `, queryParams);

      return res.status(200).json({
        items: itemsResult.rows,
        pagination: { totalItems, totalPages, currentPage: page, itemsPerPage: limit }
      });
    }

    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Non autorisé' });
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
        
        if (!/^https?:\/\//i.test(url)) {
            processedUrl = `https://${url}`;
        }
        
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
