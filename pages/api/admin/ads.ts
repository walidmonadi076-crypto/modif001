// Fix: Use type-only import for NextApiRequest to correct type resolution.
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';
import { Ad } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const client = await getDbClient();
  try {
    if (req.method === 'GET') {
      const result = await client.query('SELECT placement, code FROM ads');
      res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
      const ads: Record<string, string> = req.body;
      
      await client.query('BEGIN');
      for (const placement in ads) {
        if (Object.prototype.hasOwnProperty.call(ads, placement)) {
          const code = ads[placement];
          await client.query(
            `INSERT INTO ads (placement, code) 
             VALUES ($1, $2)
             ON CONFLICT (placement) 
             DO UPDATE SET code = EXCLUDED.code, updated_at = NOW()`,
            [placement, code]
          );
        }
      }
      await client.query('COMMIT');
      
      res.status(200).json({ success: true, message: 'Publicités mises à jour.' });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("API Error in /api/admin/ads:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}