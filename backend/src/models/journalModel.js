import { query } from '../utils/db.js';

export const getJournalEntries = async (userId, search = '') => {
  let sql = 'SELECT * FROM journal_entries WHERE user_id = $1';
  const params = [userId];

  if (search) {
    const term = `%${search}%`;
    params.push(term, term, term);
    sql += ' AND (title LIKE $2 OR body LIKE $3 OR tags::text LIKE $4)';
  }

  sql += ' ORDER BY entry_date DESC, created_at DESC';
  const res = await query(sql, params);
  return res.rows;
};

export const getJournalEntryById = async (userId, id) => {
  const res = await query(
    'SELECT * FROM journal_entries WHERE user_id = $1 AND id = $2',
    [userId, id]
  );
  return res.rows[0];
};

export const createJournalEntry = async (userId, entryDate, title, body, mood, tags) => {
  const res = await query(
    `INSERT INTO journal_entries (user_id, entry_date, title, body, mood, tags)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, entryDate, title || null, body, mood || null, tags || []]
  );
  return res.rows[0];
};

export const updateJournalEntry = async (userId, id, fields) => {
  const sets = [];
  const values = [];
  let idx = 1;

  for (const key in fields) {
    sets.push(`${key} = $${idx}`);
    values.push(fields[key]);
    idx++;
  }

  values.push(userId, id);
  const sql = `UPDATE journal_entries SET ${sets.join(', ')}, updated_at = NOW() WHERE user_id = $${idx} AND id = $${idx + 1} RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0];
};

export const deleteJournalEntry = async (userId, id) => {
  await query('DELETE FROM journal_entries WHERE user_id = $1 AND id = $2', [userId, id]);
};
