import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';
import type { Ad } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ad[] | { error: string }>
) {
  const client = await getDbClient();
  try {
    const result = await client.query(
      'SELECT placement, code FROM ads'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  } finally {
    client.release();
  }
}