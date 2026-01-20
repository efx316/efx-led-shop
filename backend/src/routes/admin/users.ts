import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth.js';
import pool from '../../db/index.js';
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

// Get all users
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // First, check if permission columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('can_view_prices', 'can_order_products')
    `);
    
    const hasPermissionColumns = columnCheck.rows.length === 2;
    
    // Build query based on whether columns exist
    let query: string;
    if (hasPermissionColumns) {
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.company_name,
          u.phone,
          u.is_admin,
          COALESCE(u.can_view_prices, false) as can_view_prices,
          COALESCE(u.can_order_products, false) as can_order_products,
          u.created_at,
          COALESCE(up.current_balance, 0) as points_balance,
          COALESCE(up.total_accumulated, 0) as points_total,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
         FROM users u
         LEFT JOIN user_points up ON u.id = up.user_id
         ORDER BY u.created_at DESC
      `;
    } else {
      // Fallback query without permission columns (defaults to false)
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.company_name,
          u.phone,
          u.is_admin,
          false as can_view_prices,
          false as can_order_products,
          u.created_at,
          COALESCE(up.current_balance, 0) as points_balance,
          COALESCE(up.total_accumulated, 0) as points_total,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
         FROM users u
         LEFT JOIN user_points up ON u.id = up.user_id
         ORDER BY u.created_at DESC
      `;
    }

    const result = await pool.query(query);
    
    // If columns don't exist, add a warning
    const response: any = { users: result.rows };
    if (!hasPermissionColumns) {
      response.warning = 'Permission columns not found. Please run migration: database/migrations/add_user_permissions.sql';
    }

    res.json(response);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    const errorMessage = error?.message || 'Failed to fetch users';
    res.status(500).json({ error: 'Failed to fetch users', details: errorMessage });
  }
});

// Get single user
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if permission columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('can_view_prices', 'can_order_products')
    `);
    
    const hasPermissionColumns = columnCheck.rows.length === 2;
    
    // Build query based on whether columns exist
    let query: string;
    if (hasPermissionColumns) {
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.company_name,
          u.phone,
          u.is_admin,
          COALESCE(u.can_view_prices, false) as can_view_prices,
          COALESCE(u.can_order_products, false) as can_order_products,
          u.created_at,
          COALESCE(up.current_balance, 0) as points_balance,
          COALESCE(up.total_accumulated, 0) as points_total,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
         FROM users u
         LEFT JOIN user_points up ON u.id = up.user_id
         WHERE u.id = $1
      `;
    } else {
      query = `
        SELECT 
          u.id,
          u.email,
          u.name,
          u.company_name,
          u.phone,
          u.is_admin,
          false as can_view_prices,
          false as can_order_products,
          u.created_at,
          COALESCE(up.current_balance, 0) as points_balance,
          COALESCE(up.total_accumulated, 0) as points_total,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
         FROM users u
         LEFT JOIN user_points up ON u.id = up.user_id
         WHERE u.id = $1
      `;
    }
    
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    const errorMessage = error?.message || 'Failed to fetch user';
    res.status(500).json({ error: 'Failed to fetch user', details: errorMessage });
  }
});

// Update user permissions schema
const updateUserPermissionsSchema = z.object({
  can_view_prices: z.boolean().optional(),
  can_order_products: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});

// Update user permissions
router.patch('/:id/permissions', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const data = updateUserPermissionsSchema.parse(req.body);

    // Check if permission columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('can_view_prices', 'can_order_products')
    `);
    
    const hasPermissionColumns = columnCheck.rows.length === 2;

    // If trying to update permissions but columns don't exist
    if (!hasPermissionColumns && (data.can_view_prices !== undefined || data.can_order_products !== undefined)) {
      return res.status(400).json({ 
        error: 'Permission columns not found',
        details: 'Please run the migration first: database/migrations/add_user_permissions.sql',
        message: 'The can_view_prices and can_order_products columns do not exist in the database yet.'
      });
    }

    // Prevent users from removing their own admin status
    if (userId === req.userId && data.is_admin === false) {
      return res.status(400).json({ error: 'Cannot remove your own admin status' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Track which permission columns we're updating to avoid duplicates
    const updatingPermissions = {
      can_view_prices: false,
      can_order_products: false,
    };

    // Only add permission updates if columns exist
    if (hasPermissionColumns) {
      if (data.can_view_prices !== undefined) {
        updates.push(`can_view_prices = $${paramCount++}`);
        values.push(data.can_view_prices);
        updatingPermissions.can_view_prices = true;
      }
      if (data.can_order_products !== undefined) {
        updates.push(`can_order_products = $${paramCount++}`);
        values.push(data.can_order_products);
        updatingPermissions.can_order_products = true;
      }
    }

    if (data.is_admin !== undefined) {
      updates.push(`is_admin = $${paramCount++}`);
      values.push(data.is_admin);
      // If making admin and columns exist, also grant all permissions (only if not already being updated)
      if (data.is_admin && hasPermissionColumns) {
        if (!updatingPermissions.can_view_prices) {
          updates.push(`can_view_prices = $${paramCount++}`);
          values.push(true);
        }
        if (!updatingPermissions.can_order_products) {
          updates.push(`can_order_products = $${paramCount++}`);
          values.push(true);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    
    // Build RETURNING clause based on whether columns exist
    let returningClause = 'id, email, name, company_name, phone, is_admin, created_at';
    if (hasPermissionColumns) {
      returningClause += ', can_view_prices, can_order_products';
    } else {
      // Return false as defaults if columns don't exist
      returningClause += ', false as can_view_prices, false as can_order_products';
    }
    
    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING ${returningClause}`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating user permissions:', error);
    const errorMessage = error?.message || 'Failed to update user permissions';
    res.status(500).json({ error: 'Failed to update user permissions', details: errorMessage });
  }
});

export default router;
