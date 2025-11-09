// Fix: Use type-only import for NextApiRequest to correct type resolution.
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
      ? 'SELECT id FROM blog_posts WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM blog_posts WHERE slug = $1';
    
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
  const client = await getDbClient();
  try {
    if (req.method === 'GET') {
      if (!isAuthorized(req)) {
          return res.status(401).json({ error: 'Non autorisé' });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const sortBy = req.query.sortBy as string || 'id';
      const sortOrder = req.query.sortOrder as string || 'desc';
      const offset = (page - 1) * limit;

      const allowedSortBy = ['id', 'title', 'category'];
      const sanitizedSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'id';
      const sanitizedSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

      let whereClause = '';
      const queryParams: any[] = [];
      if (search) {
        queryParams.push(`%${search}%`);
        whereClause = `WHERE title ILIKE $${queryParams.length} OR author ILIKE $${queryParams.length}`;
      }
      
      const totalResult = await client.query(`SELECT COUNT(*) FROM blog_posts ${whereClause}`, queryParams);
      const totalItems = parseInt(totalResult.rows[0].count, 10);
      const totalPages = Math.ceil(totalItems / limit);

      queryParams.push(limit, offset);
      const itemsResult = await client.query(`
        SELECT 
          id, slug, title, summary, image_url AS "imageUrl", video_url AS "videoUrl",
          author, publish_date AS "publishDate", rating::float, affiliate_url AS "affiliateUrl",
          content, category
        FROM blog_posts
        ${whereClause}
        ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}
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

    if (req.method === 'POST') {
      const { title, summary, imageUrl, videoUrl, author, publishDate, rating, affiliateUrl, content, category } = req.body;
      if (!title) return res.status(400).json({ error: 'Le champ "Titre" est obligatoire.' });
      
      const slug = await generateUniqueSlug(client, title);
      const result = await client.query(
        `INSERT INTO blog_posts (title, slug, summary, image_url, video_url, author, publish_date, rating, affiliate_url, content, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [title, slug, summary, imageUrl, videoUrl || null, author, publishDate || new Date().toISOString().split('T')[0], parseFloat(rating) || 0, affiliateUrl || null, content, category]
      );
      res.status(201).json(result.rows[0]);

    } else if (req.method === 'PUT') {
      const { id, title, summary, imageUrl, videoUrl, author, publishDate, rating, affiliateUrl, content, category } = req.body;
      if (!title) return res.status(400).json({ error: 'Le champ "Titre" est obligatoire.' });

      const slug = await generateUniqueSlug(client, title, id);
      const result = await client.query(
        `UPDATE blog_posts 
         SET title = $1, slug = $2, summary = $3, image_url = $4, video_url = $5, author = $6, publish_date = $7, rating = $8, affiliate_url = $9, content = $10, category = $11 
         WHERE id = $12 RETURNING *`,
        [title, slug, summary, imageUrl, videoUrl || null, author, publishDate || new Date().toISOString().split('T')[0], parseFloat(rating) || 0, affiliateUrl || null, content, category, id]
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
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error("API Error in /api/admin/blogs:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
     client.release();
  }
}