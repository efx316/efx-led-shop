import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  awardVisitPoints,
  getUserPoints,
  getPointsTransactions,
} from '../services/pointsService.js';

const router = Router();

// Award visit points
router.post('/visit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await awardVisitPoints(userId);
    res.json(result);
  } catch (error) {
    console.error('Award visit points error:', error);
    res.status(500).json({ error: 'Failed to award visit points' });
  }
});

// Get user points (default endpoint)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const points = await getUserPoints(userId);
    res.json(points);
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Failed to get points' });
  }
});

// Get user points (alias)
router.get('/balance', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const points = await getUserPoints(userId);
    res.json(points);
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({ error: 'Failed to get points' });
  }
});

// Get points transaction history
router.get('/transactions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await getPointsTransactions(userId, limit);
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

export default router;

