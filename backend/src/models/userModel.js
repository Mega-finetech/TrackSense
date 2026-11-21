import { query } from '../utils/db.js';

export const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await query('SELECT id, name, email, is_verified, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const createUser = async (name, email, passwordHash) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, is_verified)
     VALUES ($1, $2, $3, FALSE)
     RETURNING id, name, email, is_verified, created_at`,
    [name, email.toLowerCase(), passwordHash]
  );
  return result.rows[0];
};

export const markUserVerified = async (id) => {
  const result = await query(
    `UPDATE users SET is_verified = TRUE WHERE id = $1
     RETURNING id, name, email, is_verified, created_at`,
    [id]
  );
  return result.rows[0];
};

export const updateUserPassword = async (id, passwordHash) => {
  const result = await query(
    `UPDATE users SET password_hash = $2, is_verified = TRUE WHERE id = $1
     RETURNING id, name, email, is_verified, created_at`,
    [id, passwordHash]
  );
  return result.rows[0];
};
