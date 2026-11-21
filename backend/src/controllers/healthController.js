import { query } from '../utils/db.js';

export const getHealth = async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  }
};
