import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/index.js';
import { requireAuth } from './auth.js';

const router = Router();

router.use(requireAuth);

// Ultimele notificări ale utilizatorului și câte sunt necitite (pentru clopoțelul din antet).
router.get('/', async (req, res) => {
  try {
    const [listResult, countResult] = await Promise.all([
      pool.query(
        'SELECT id, type, message, link, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
        [req.user?.sub],
      ),
      pool.query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false', [req.user?.sub]),
    ]);

    return res.status(200).json({
      unreadCount: countResult.rows[0].count,
      notifications: listResult.rows.map((row) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        link: row.link,
        isRead: row.is_read,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('List notifications error:', error);
    return res.status(500).json({ message: 'Eroare la încărcarea notificărilor.' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [req.user?.sub]);
    return res.status(200).json({ message: 'Toate notificările au fost marcate ca citite.' });
  } catch (error) {
    console.error('Read all notifications error:', error);
    return res.status(500).json({ message: 'Eroare la marcarea notificărilor.' });
  }
});

router.post('/:id/read', async (req, res) => {
  const idResult = z.string().uuid().safeParse(req.params.id);
  if (!idResult.success) return res.status(400).json({ message: 'ID invalid.' });

  try {
    const result = await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [idResult.data, req.user?.sub]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Notificarea nu a fost găsită.' });
    return res.status(200).json({ message: 'Notificarea a fost marcată ca citită.' });
  } catch (error) {
    console.error('Read notification error:', error);
    return res.status(500).json({ message: 'Eroare la marcarea notificării.' });
  }
});

export default router;
