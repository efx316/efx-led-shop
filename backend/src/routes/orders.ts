import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createSquareOrder } from '../services/squareOrderService.js';
import pool from '../db/index.js';
import { locationId } from '../services/squareService.js';

const router = Router();

const createOrderSchema = z.object({
  // Custom LED order fields
  environment: z.enum(['indoor', 'outdoor', 'weatherproof']).optional(),
  colorType: z.enum(['single', 'dual', 'rgb', 'rgbw']).optional(),
  ledType: z.string().optional(),
  length: z.number().optional(),
  tailWireLength: z.number().optional(),
  strips: z.array(z.object({
    length: z.number(),
    connectionType: z.enum(['tail', 'link']),
    connectionLength: z.number(),
  })).optional(),
  includeDriver: z.boolean().optional(),
  includeProfile: z.boolean().optional(),
  selectedProfile: z.string().nullable().optional(),
  includeEndCaps: z.boolean().optional(),
  notes: z.string().optional(),
  projectName: z.string().optional(),
  company: z.string().optional(),
  customerName: z.string().optional(),
  mobile: z.string().optional(),
  recommendedDriver: z.string().optional(),
  
  // Square order fields (for regular orders)
  lineItems: z.array(z.object({
    catalogObjectId: z.string(),
    quantity: z.string(),
    name: z.string(),
    note: z.string().optional(),
  })).optional(),
  customerId: z.string().optional(),
});

// Create order
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = createOrderSchema.parse(req.body);

    // Check if this is a custom LED order or regular Square order
    const isCustomLEDOrder = !!data.environment;

    if (isCustomLEDOrder) {
      // Custom LED order - save as pending, don't create Square order yet
      const result = await pool.query(
        `INSERT INTO orders (
          user_id, 
          status, 
          total_amount,
          custom_order_data
        )
         VALUES ($1, $2, $3, $4)
         RETURNING id, status, created_at`,
        [
          userId,
          'pending',
          0, // Will be calculated when approved
          JSON.stringify({
            environment: data.environment,
            colorType: data.colorType,
            ledType: data.ledType,
            length: data.length,
            tailWireLength: data.tailWireLength,
            strips: data.strips,
            includeDriver: data.includeDriver,
            includeProfile: data.includeProfile,
            includeEndCaps: data.includeEndCaps,
            notes: data.notes,
            projectName: data.projectName,
            company: data.company,
            customerName: data.customerName,
            mobile: data.mobile,
            recommendedDriver: data.recommendedDriver,
          }),
        ]
      );

      const order = result.rows[0];

      res.status(201).json({
        order: {
          id: order.id,
          status: order.status,
          created_at: order.created_at,
        },
        message: 'Order submitted successfully. It will be reviewed and approved shortly.',
      });
      return;
    }

    // Regular Square order flow
    if (!data.lineItems || data.lineItems.length === 0) {
      return res.status(400).json({ error: 'Line items are required for regular orders' });
    }

    // Create order in Square
    const squareOrder = await createSquareOrder({
      lineItems: data.lineItems,
      customerId: data.customerId,
      referenceId: `user_${userId}`,
    });

    // Calculate total amount
    const totalAmount = squareOrder.totalMoney?.amount
      ? Number(squareOrder.totalMoney.amount) / 100
      : 0;

    // Save order to database
    const result = await pool.query(
      `INSERT INTO orders (user_id, square_order_id, total_amount, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, square_order_id, total_amount, status, created_at`,
      [userId, squareOrder.id, totalAmount, squareOrder.state || 'DRAFT']
    );

    const order = result.rows[0];

    // Award points: 1 point per $10 spent (rounded down)
    const pointsEarned = Math.floor(totalAmount / 10);
    if (pointsEarned > 0) {
      await pool.query(
        `UPDATE user_points
         SET current_balance = current_balance + $1,
             total_accumulated = total_accumulated + $1
         WHERE user_id = $2`,
        [pointsEarned, userId]
      );

      await pool.query(
        `INSERT INTO points_transactions (user_id, type, amount, description, reference_id, reference_type)
         VALUES ($1, 'earned', $2, $3, $4, 'order')`,
        [userId, pointsEarned, `Purchase points: $${totalAmount.toFixed(2)}`, order.id]
      );
    }

    res.status(201).json({
      order: {
        id: order.id,
        square_order_id: order.square_order_id,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
      },
      squareOrder: {
        id: squareOrder.id,
        state: squareOrder.state,
        totalMoney: squareOrder.totalMoney,
      },
      pointsEarned,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create order error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    res.status(500).json({ error: errorMessage, details: error instanceof Error ? error.stack : undefined });
  }
});

// Get user's orders
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await pool.query(
      `SELECT 
        id,
        square_order_id,
        status,
        total_amount,
        custom_order_data,
        created_at,
        updated_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by ID (for editing)
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const orderId = parseInt(req.params.id);

    const result = await pool.query(
      `SELECT 
        id,
        square_order_id,
        status,
        total_amount,
        custom_order_data,
        created_at,
        updated_at
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update pending order
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const orderId = parseInt(req.params.id);
    const data = createOrderSchema.parse(req.body);

    // Verify order exists, belongs to user, and is pending
    const orderCheck = await pool.query(
      `SELECT id, status, user_id FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];

    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own orders' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be edited' });
    }

    // Check if this is a custom LED order
    const isCustomLEDOrder = !!data.environment;

    if (!isCustomLEDOrder) {
      return res.status(400).json({ error: 'Only custom LED orders can be edited through this endpoint' });
    }

    // Update the order
    const result = await pool.query(
      `UPDATE orders
       SET custom_order_data = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 AND status = 'pending'
       RETURNING id, status, updated_at`,
      [
        JSON.stringify({
          environment: data.environment,
          colorType: data.colorType,
          ledType: data.ledType,
          length: data.length,
          tailWireLength: data.tailWireLength,
          strips: data.strips,
          includeDriver: data.includeDriver,
          includeProfile: data.includeProfile,
          includeEndCaps: data.includeEndCaps,
          accessories: data.accessories,
          notes: data.notes,
          projectName: data.projectName,
          company: data.company,
          customerName: data.customerName,
          mobile: data.mobile,
          recommendedDriver: data.recommendedDriver,
        }),
        orderId,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Failed to update order. Make sure it is still pending.' });
    }

    res.json({
      order: result.rows[0],
      message: 'Order updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update order error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;

