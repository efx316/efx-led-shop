import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { getUserById } from '../services/userService.js';
import pool from '../db/index.js';

const router = Router();

// Get current user profile (default endpoint)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user points
    const pointsResult = await pool.query(
      `SELECT current_balance, total_accumulated FROM user_points WHERE user_id = $1`,
      [userId]
    );

    const points = pointsResult.rows[0] || { current_balance: 0, total_accumulated: 0 };

    // Get is_admin from users table
    const adminResult = await pool.query(
      `SELECT is_admin FROM users WHERE id = $1`,
      [userId]
    );

    res.json({
      ...user,
      is_admin: adminResult.rows[0]?.is_admin || false,
      points: {
        current: points.current_balance,
        total: points.total_accumulated,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get current user profile (alias)
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user points
    const pointsResult = await pool.query(
      `SELECT current_balance, total_accumulated FROM user_points WHERE user_id = $1`,
      [userId]
    );

    const points = pointsResult.rows[0] || { current_balance: 0, total_accumulated: 0 };

    // Get is_admin from users table
    const adminResult = await pool.query(
      `SELECT is_admin FROM users WHERE id = $1`,
      [userId]
    );

    res.json({
      ...user,
      is_admin: adminResult.rows[0]?.is_admin || false,
      points: {
        current: points.current_balance,
        total: points.total_accumulated,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user order history
router.get('/orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    const result = await pool.query(
      `SELECT id, square_order_id, total_amount, status, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

export default router;

