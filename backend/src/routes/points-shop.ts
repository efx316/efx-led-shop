import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import pool from '../db/index.js';

const router = Router();

// Get shop items
router.get('/items', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, point_cost, image_url, stock_quantity, active
       FROM points_shop_items
       WHERE active = true
       ORDER BY point_cost ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ error: 'Failed to get shop items' });
  }
});

// Redeem item
router.post('/redeem', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { itemId } = z.object({ itemId: z.number() }).parse(req.body);

    const itemResult = await pool.query(
      `SELECT id, name, point_cost, stock_quantity FROM points_shop_items WHERE id = $1 AND active = true`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemResult.rows[0];

    if (item.stock_quantity <= 0) {
      return res.status(400).json({ error: 'Item out of stock' });
    }

    const pointsResult = await pool.query(
      `SELECT current_balance FROM user_points WHERE user_id = $1`,
      [userId]
    );

    const userPoints = pointsResult.rows[0]?.current_balance || 0;

    if (userPoints < item.point_cost) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    await pool.query(
      `UPDATE user_points
       SET current_balance = current_balance - $1
       WHERE user_id = $2`,
      [item.point_cost, userId]
    );

    await pool.query(
      `INSERT INTO points_transactions (user_id, type, amount, description, reference_id, reference_type)
       VALUES ($1, 'spent', $2, $3, $4, 'redemption')`,
      [userId, item.point_cost, `Redeemed: ${item.name}`, itemId]
    );

    const redemptionResult = await pool.query(
      `INSERT INTO points_redemptions (user_id, item_id, points_spent, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [userId, itemId, item.point_cost]
    );

    await pool.query(
      `UPDATE points_shop_items
       SET stock_quantity = stock_quantity - 1
       WHERE id = $1`,
      [itemId]
    );

    res.json({
      success: true,
      redemptionId: redemptionResult.rows[0].id,
      remainingPoints: userPoints - item.point_cost,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Redeem item error:', error);
    res.status(500).json({ error: 'Failed to redeem item' });
  }
});

export default router;



