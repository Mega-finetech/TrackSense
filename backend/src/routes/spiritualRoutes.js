import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as spiritualCtrl from '../controllers/spiritualController.js';
import * as journalCtrl from '../controllers/journalController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/prayer', spiritualCtrl.listPrayerLogs);
router.post('/prayer', spiritualCtrl.savePrayerLog);
router.get('/devotion', spiritualCtrl.listDevotionLogs);
router.post('/devotion', spiritualCtrl.saveDevotionLog);

router.get('/journal', journalCtrl.listJournalEntries);
router.get('/journal/:id', journalCtrl.getJournalEntry);
router.post('/journal', journalCtrl.createJournalEntry);
router.put('/journal/:id', journalCtrl.updateJournalEntry);
router.delete('/journal/:id', journalCtrl.deleteJournalEntry);

export default router;
