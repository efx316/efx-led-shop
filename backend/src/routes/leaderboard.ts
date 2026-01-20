import { Router, Request, Response } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    
    const query = `
      SELECT 
        up.user_id,
        u.email,
        u.company_name,
        up.total_accumulated,
        ROW_NUMBER() OVER (ORDER BY up.total_accumulated DESC) as rank
      FROM user_points up
      JOIN users u ON up.user_id = u.id
      WHERE up.total_accumulated > 0
      ORDER BY up.total_accumulated DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;



