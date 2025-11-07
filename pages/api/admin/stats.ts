import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await getDbClient();
  try {
    const [
      gamesResult,
      blogsResult,
      productsResult,
      gameCategoriesResult,
      blogCategoriesResult,
      productCategoriesResult,
    ] = await Promise.all([
      client.query('SELECT COUNT(*) FROM games'),
      client.query('SELECT COUNT(*) FROM blog_posts'),
      client.query('SELECT COUNT(*) FROM products'),
      client.query("SELECT COUNT(DISTINCT category) FROM games WHERE category IS NOT NULL AND category <> ''"),
      client.query("SELECT COUNT(DISTINCT category) FROM blog_posts WHERE category IS NOT NULL AND category <> ''"),
      client.query("SELECT COUNT(DISTINCT category) FROM products WHERE category IS NOT NULL AND category <> ''"),
    ]);

    const stats = {
      totalGames: parseInt(gamesResult.rows[0].count, 10),
      totalBlogs: parseInt(blogsResult.rows[0].count, 10),
      totalProducts: parseInt(productsResult.rows[0].count, 10),
      gameCategories: parseInt(gameCategoriesResult.rows[0].count, 10),
      blogCategories: parseInt(blogCategoriesResult.rows[0].count, 10),
      productCategories: parseInt(productCategoriesResult.rows[0].count, 10),
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("API Error in /api/admin/stats:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}
