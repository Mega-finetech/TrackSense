import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { query } from '../utils/db.js';
import { readPreferences, savePreferences } from '../services/accountPreferences.js';
const router = express.Router();
router.use(auth);
router.get('/', async (req, res) => res.json(await readPreferences(query, req.user.id)));
router.put('/', async (req, res) => res.json(await savePreferences(query, req.user.id, req.body)));
export default router;
