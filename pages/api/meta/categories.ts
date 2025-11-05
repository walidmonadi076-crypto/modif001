
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDbClient } from '../../../db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string[] | { error: string }>
) {
  const client = await getDbClient();
  try {
    const result = await client.query(
      "SELECT DISTINCT category FROM games WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC"
    );
    res.status(200).json(result.rows.map(row => row.category));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  } finally {
    client.release();
  }
}
