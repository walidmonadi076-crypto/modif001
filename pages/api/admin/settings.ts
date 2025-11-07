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
      const src = result.rows[0]?.value || '';
      return res.status(200).json({ [OGADS_SCRIPT_KEY]: src });
    }
    
    if (req.method === 'POST') {
      const { ogads_script_src: rawInput } = req.body;
      if (typeof rawInput !== 'string') {
        return res.status(400).json({ error: 'Le champ ogads_script_src est invalide.' });
      }

      const trimmedInput = rawInput.trim();
      let finalSrc = '';

      // Regex to find src attribute specifically in a <script> tag, anywhere in the string
      const srcRegex = /<script[^>]*src="([^"]+)"/i;
      const match = trimmedInput.match(srcRegex);

      if (match && match[1]) {
        // We found a script tag with a src, let's use that.
        finalSrc = match[1];
      } else {
        // No script tag found, maybe the user pasted the URL directly.
        finalSrc = trimmedInput;
      }

      // Now, validate if finalSrc is a valid URL (unless it's empty, which is allowed)
      if (finalSrc) {
        try {
          new URL(finalSrc);
        } catch (_) {
          // If validation fails, it means the input was neither a valid script tag with src, nor a valid URL.
          return res.status(400).json({ error: `Le code fourni est invalide. Assurez-vous de coller le code <script> complet ou une URL valide.` });
        }
      }
      
      await client.query(
        `INSERT INTO site_settings (key, value) 
         VALUES ($1, $2)
         ON CONFLICT (key) 
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [OGADS_SCRIPT_KEY, finalSrc]
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
