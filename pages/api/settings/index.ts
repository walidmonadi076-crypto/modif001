import type { NextApiRequest, NextApiResponse } from 'next';
import { getSiteSettings } from '../../../lib/data';
import type { SiteSettings } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SiteSettings | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const settings = await getSiteSettings();
    // Public route, add cache headers
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(settings);
  } catch (error) {
    console.error('API Error in /api/settings:', error);
    res.status(500).json({ error: 'Failed to fetch site settings' });
  }
}
