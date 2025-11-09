// Fix: Use type-only import for NextApiRequest to correct type resolution.
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';

const OGADS_SCRIPT_KEY = 'ogads_script_src';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const client = await getDbClient();

  try {
    if (req.method === 'GET') {
      const result = await client.query('SELECT value FROM site_settings WHERE key = $1', [OGADS_SCRIPT_KEY]);
      const value = result.rows[0]?.value || '';
      return res.status(200).json({ [OGADS_SCRIPT_KEY]: value });
    }
    
    if (req.method === 'POST') {
      const { ogads_script_src: rawInput } = req.body;

      // Allow an empty string to be saved, which effectively disables the script.
      const scriptToSave = typeof rawInput === 'string' ? rawInput.trim() : '';
      
      await client.query(
        `INSERT INTO site_settings (key, value) 
         VALUES ($1, $2)
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [OGADS_SCRIPT_KEY, scriptToSave]
      );
      
      return res.status(200).json({ success: true, message: 'Paramètres mis à jour.' });
    }
    
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error("API Error in /api/admin/settings:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}