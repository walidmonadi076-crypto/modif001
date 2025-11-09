import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import { isAuthorized } from '../auth/check';
import { getSiteSettings, SiteSettings } from '../../../lib/data';

const SETTING_KEYS = [
  'site_name', 'site_icon_url', 'ogads_script_src',
  'hero_title', 'hero_subtitle', 'hero_button_text', 'hero_button_url', 'hero_bg_url',
  'promo_enabled', 'promo_text', 'promo_button_text', 'promo_button_url'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await getDbClient();

  try {
    if (req.method === 'GET') {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
      const settings = await getSiteSettings();
      return res.status(200).json(settings);
    }
    
    if (req.method === 'POST') {
      if (!isAuthorized(req)) {
        return res.status(401).json({ error: 'Non autorisé' });
      }
      const settings: Partial<SiteSettings> = req.body;
      
      await client.query('BEGIN');
      for (const key in settings) {
        if (SETTING_KEYS.includes(key) && Object.prototype.hasOwnProperty.call(settings, key)) {
          // @ts-ignore
          const value = settings[key];
          const valueToStore = typeof value === 'boolean' ? String(value) : value;

          await client.query(
            `INSERT INTO site_settings (key, value) 
             VALUES ($1, $2)
             ON CONFLICT (key) 
             DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
            [key, valueToStore]
          );
        }
      }
      await client.query('COMMIT');
      
      try {
        await res.revalidate('/');
      } catch (err) {
        console.error('Error revalidating homepage after settings update:', err);
      }
      
      return res.status(200).json({ success: true, message: 'Paramètres mis à jour.' });
    }
    
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("API Error in /api/admin/settings:", error);
    res.status(500).json({ error: 'Erreur interne du serveur.', details: (error as Error).message });
  } finally {
    client.release();
  }
}