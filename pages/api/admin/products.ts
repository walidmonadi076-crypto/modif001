import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const client = await getDbClient();

  try {
    const { id, name, imageUrl, price, url, description, gallery, category } = req.body;
    
    // Validation stricte des données pour POST et PUT
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Le champ "Nom" est obligatoire.' });
        }
        if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
            return res.status(400).json({ error: 'Le champ "URL de l\'image" est obligatoire.' });
        }
        if (price === undefined || price === null || String(price).trim() === '') {
            return res.status(400).json({ error: 'Le champ "Prix" est obligatoire.' });
        }
         if (!category || typeof category !== 'string' || category.trim() === '') {
            return res.status(400).json({ error: 'Le champ "Catégorie" est obligatoire.' });
        }
    }
    
    // Nettoyage et préparation des données
    let numericPrice = 0;
    if (typeof price === 'string') {
        numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    } else if (typeof price === 'number') {
        numericPrice = price;
    }
    const safeGallery = Array.isArray(gallery) ? gallery.filter(g => typeof g === 'string' && g.trim() !== '') : [];
    const safeUrl = url || '#';
    const safeDescription = description || '';

    if (req.method === 'POST') {
      const result = await client.query(
        `INSERT INTO products (name, image_url, price, url, description, gallery, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [name, imageUrl, numericPrice, safeUrl, safeDescription, safeGallery, category]
      );
      
      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const result = await client.query(
        `UPDATE products 
         SET name = $1, image_url = $2, price = $3, url = $4, description = $5, gallery = $6, category = $7 
         WHERE id = $8 RETURNING *`,
        [name, imageUrl, numericPrice, safeUrl, safeDescription, safeGallery, category, id]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Product not found' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      const result = await client.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        res.status(404).json({ message: 'Product not found' });
      } else {
        res.status(200).json({ message: 'Product deleted successfully' });
      }
    } else {
      res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error("API Error in /api/admin/products:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}
