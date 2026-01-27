import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import pool from '../db/index.js';
import { z } from 'zod';

const router = Router();

// Middleware to check if user is admin
async function requireAdmin(req: AuthRequest, res: Response, next: any) {
  try {
    const userId = req.userId!;
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
}

// Get all pending orders
router.get('/orders/pending', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.user_id,
        o.status,
        o.total_amount,
        o.custom_order_data,
        o.created_at,
        u.email,
        u.name as user_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status = 'pending'
       ORDER BY o.created_at DESC`
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

// Get all orders
router.get('/orders', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    let query = `
      SELECT 
        o.id,
        o.user_id,
        o.square_order_id,
        o.status,
        o.total_amount,
        o.custom_order_data,
        o.created_at,
        o.updated_at,
        u.email,
        u.name as user_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    const params: any[] = [];

    if (status) {
      query += ' WHERE o.status = $1';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order details
router.get('/orders/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const result = await pool.query(
      `SELECT 
        o.*,
        u.email,
        u.name as user_name,
        u.phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
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

// Approve order
const approveOrderSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending', 'picked_up']),
  notes: z.string().optional(),
});

router.patch('/orders/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const data = approveOrderSchema.parse(req.body);

    // Get order details
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Update order status
    await pool.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [data.status, orderId]
    );

    // If approved, create Square order (if custom LED order)
    if (data.status === 'approved' && order.custom_order_data && !order.square_order_id) {
      // TODO: Create Square order from custom_order_data
      // For now, just update the status
    }

    // Create notification for user (don't fail if this fails)
    try {
      let notificationTitle = 'Order Updated';
      let notificationMessage = `Your order #${orderId} status has been updated.`;
      
      if (data.status === 'approved') {
        notificationTitle = 'Order Approved';
        notificationMessage = `Your order #${orderId} has been approved and is being processed.`;
      } else if (data.status === 'picked_up') {
        notificationTitle = 'Order Picked Up';
        notificationMessage = `Your order #${orderId} has been marked as picked up. Thank you!`;
      }
      
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.user_id,
          'order_status',
          notificationTitle,
          notificationMessage,
          orderId,
          'order',
        ]
      );
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Send email notification
    try {
      const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [order.user_id]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        if (data.status === 'approved') {
          const { sendOrderApprovalEmail } = await import('../services/emailService.js');
          await sendOrderApprovalEmail(user.email, user.name || user.email, orderId);
        }
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    // Return success response
    return res.json({
      success: true,
      message: `Order ${data.status} successfully`,
      order: {
        id: orderId,
        status: data.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Approve order error:', error);
    return res.status(500).json({ error: 'Failed to approve order' });
  }
});

// Import category, product, user, and points-shop admin routes
import categoryRoutes from './admin/categories.js';
import productRoutes from './admin/products.js';
import userRoutes from './admin/users.js';
import pointsShopRoutes from './admin/points-shop.js';

// Mount category routes
router.use('/categories', categoryRoutes);

// Mount product routes
router.use('/products', productRoutes);

// Mount user routes
router.use('/users', userRoutes);

// Mount points shop routes
router.use('/points-shop', pointsShopRoutes);

export default router;

