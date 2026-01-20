import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { calculateDriverRecommendation } from '../services/driverCalculator.js';

const router = Router();

const recommendationSchema = z.object({
  totalWatts: z.number().positive(),
  voltage: z.string().regex(/^(12V|24V)$/i),
  safetyMargin: z.number().min(1).max(2).optional(),
});

// Get driver recommendation
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const data = recommendationSchema.parse(req.body);
    
    const recommendation = await calculateDriverRecommendation({
      totalWatts: data.totalWatts,
      voltage: data.voltage,
      safetyMargin: data.safetyMargin,
    });

    if (!recommendation) {
      return res.status(404).json({ error: 'No suitable driver found' });
    }

    res.json(recommendation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Driver recommendation error:', error);
    res.status(500).json({ error: 'Failed to calculate driver recommendation' });
  }
});

export default router;



