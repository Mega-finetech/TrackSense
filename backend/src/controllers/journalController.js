import * as journalModel from '../models/journalModel.js';

const MOODS = ['😊', '😌', '🙏', '💛', '🌿'];

export const listJournalEntries = async (req, res) => {
  const userId = req.user.id;
  const { q } = req.query;
  const entries = await journalModel.getJournalEntries(userId, q || '');
  res.json(entries);
};

export const getJournalEntry = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const entry = await journalModel.getJournalEntryById(userId, id);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.json(entry);
};

export const createJournalEntry = async (req, res) => {
  const userId = req.user.id;
  const { entry_date, title, body, mood, tags } = req.body;

  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Journal body is required' });
  }

  if (mood && !MOODS.includes(mood)) {
    return res.status(400).json({ error: 'Invalid mood selection' });
  }

  const entry = await journalModel.createJournalEntry(
    userId,
    entry_date || new Date().toISOString().split('T')[0],
    title,
    body,
    mood,
    tags || []
  );

  res.status(201).json(entry);
};

export const updateJournalEntry = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { entry_date, title, body, mood, tags } = req.body;

  if (mood && !MOODS.includes(mood)) {
    return res.status(400).json({ error: 'Invalid mood selection' });
  }

  const entry = await journalModel.updateJournalEntry(userId, id, {
    entry_date,
    title: title || null,
    body,
    mood,
    tags: tags || [],
  });

  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  res.json(entry);
};

export const deleteJournalEntry = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  await journalModel.deleteJournalEntry(userId, id);
  res.json({ success: true });
};
