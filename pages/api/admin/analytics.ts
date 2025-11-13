
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

interface TopItem {
  name: string;
  slug: string;
  view_count: number;
}

interface AnalyticsData {
  topGames: TopItem[];
  topBlogs: TopItem[];
  topProducts: TopItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  let client;
  try {
    client = await getDbClient();
    const [gamesRes, blogsRes, productsRes] = await Promise.all([
      client.query(`
        SELECT title as name, slug, view_count 
        FROM games 
        WHERE view_count > 0
        ORDER BY view_count DESC, id DESC
        LIMIT 5
      `),
      client.query(`
        SELECT title as name, slug, view_count 
        FROM blog_posts 
        WHERE view_count > 0
        ORDER BY view_count DESC, id DESC
        LIMIT 5
      `),
      client.query(`
        SELECT name, slug, view_count 
        FROM products 
        WHERE view_count > 0
        ORDER BY view_count DESC, id DESC
        LIMIT 5
      `),
    ]);

    const data: AnalyticsData = {
      topGames: gamesRes.rows,
      topBlogs: blogsRes.rows,
      topProducts: productsRes.rows,
    };

    res.status(200).json(data);

  } catch (error) {
    console.error("API Error in /api/admin/analytics:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    if (client) {
      client.release();
    }
  }
}
