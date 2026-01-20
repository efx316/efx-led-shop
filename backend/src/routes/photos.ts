import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createPhoto, getUserPhotos, upload } from '../services/photoService.js';
import pool from '../db/index.js';

const router = Router();

// Upload photo
router.post(
  '/upload',
  authenticateToken,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const description = req.body.description || '';

      const photo = await createPhoto(userId, file, description);

      // Award +5 points for photo upload
      await pool.query(
        `UPDATE user_points
         SET current_balance = current_balance + 5,
             total_accumulated = total_accumulated + 5
         WHERE user_id = $1`,
        [userId]
      );

      await pool.query(
        `INSERT INTO points_transactions (user_id, type, amount, description, reference_id, reference_type)
         VALUES ($1, 'earned', 5, 'Photo upload', $2, 'photo')`,
        [userId, photo.id]
      );

      res.status(201).json({
        photo,
        pointsAwarded: 5,
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  }
);

// Get user photos
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const photos = await getUserPhotos(userId);
    res.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

export default router;



