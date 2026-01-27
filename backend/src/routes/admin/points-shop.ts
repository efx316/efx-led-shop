import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth.js';
import pool from '../../db/index.js';
import { z } from 'zod';
import multer from 'multer';
import { uploadFile } from '../../services/storageService.js';

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

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Get all shop items (including inactive)
router.get('/items', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, point_cost, image_url, stock_quantity, active, created_at, updated_at
       FROM points_shop_items
       ORDER BY created_at DESC`
    );
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ error: 'Failed to get shop items' });
  }
});

// Create new shop item
const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  point_cost: z.number().int().positive(),
  stock_quantity: z.number().int().min(0),
  active: z.boolean(),
});

router.post('/items', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    // Parse FormData values (they come as strings)
    const parsedBody = {
      name: req.body.name,
      description: req.body.description || undefined,
      point_cost: parseInt(req.body.point_cost, 10),
      stock_quantity: parseInt(req.body.stock_quantity || '0', 10),
      active: req.body.active === 'true' || req.body.active === true,
    };
    
    const data = createItemSchema.parse(parsedBody);
    let imageUrl: string | null = null;

    // Image is required
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Product image is required',
        hint: 'Please select an image file to upload'
      });
    }

    // Upload image
    try {
      const uploadResult = await uploadFile(req.file, 'points-shop');
      imageUrl = uploadResult.url;
    } catch (uploadError: any) {
      console.error('Image upload error:', uploadError);
      const errorMessage = uploadError?.message || 'Unknown upload error';
      console.error('Upload error details:', {
        message: errorMessage,
        provider: process.env.STORAGE_PROVIDER || 's3',
        hasBucket: !!process.env.S3_BUCKET_NAME || !!process.env.SPACES_BUCKET,
      });
      
      // Provide helpful error message based on the issue
      if (errorMessage.includes('not configured') || errorMessage.includes('BUCKET')) {
        return res.status(500).json({ 
          error: 'Storage not configured',
          details: errorMessage,
          hint: 'Please configure S3 or DigitalOcean Spaces storage. Required variables: STORAGE_PROVIDER, S3_BUCKET_NAME (or SPACES_BUCKET), AWS_ACCESS_KEY_ID (or SPACES_KEY), AWS_SECRET_ACCESS_KEY (or SPACES_SECRET)'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to upload image',
        details: errorMessage,
        hint: 'Check storage configuration and credentials'
      });
    }

    const result = await pool.query(
      `INSERT INTO points_shop_items (name, description, point_cost, image_url, stock_quantity, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, point_cost, image_url, stock_quantity, active, created_at, updated_at`,
      [data.name, data.description || null, data.point_cost, imageUrl, data.stock_quantity, data.active]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error('Create shop item error:', error);
    res.status(500).json({ error: 'Failed to create shop item' });
  }
});

// Update shop item
const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  point_cost: z.number().int().positive().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

router.put('/items/:id', authenticateToken, requireAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    
    // Parse FormData values (they come as strings)
    const parsedBody: any = {};
    if (req.body.name !== undefined) parsedBody.name = req.body.name;
    if (req.body.description !== undefined) parsedBody.description = req.body.description || undefined;
    if (req.body.point_cost !== undefined) parsedBody.point_cost = parseInt(req.body.point_cost, 10);
    if (req.body.stock_quantity !== undefined) parsedBody.stock_quantity = parseInt(req.body.stock_quantity, 10);
    if (req.body.active !== undefined) parsedBody.active = req.body.active === 'true' || req.body.active === true;
    
    const data = updateItemSchema.parse(parsedBody);

    // Get current item
    const currentResult = await pool.query(
      'SELECT * FROM points_shop_items WHERE id = $1',
      [itemId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentItem = currentResult.rows[0];
    let imageUrl = currentItem.image_url;

    // Upload new image if provided (optional for updates)
    if (req.file) {
      try {
        const uploadResult = await uploadFile(req.file, 'points-shop');
        imageUrl = uploadResult.url;
      } catch (uploadError: any) {
        console.error('Image upload error:', uploadError);
        const errorMessage = uploadError?.message || 'Unknown upload error';
        console.error('Upload error details:', {
          message: errorMessage,
          provider: process.env.STORAGE_PROVIDER || 's3',
          hasBucket: !!process.env.S3_BUCKET_NAME || !!process.env.SPACES_BUCKET,
        });
        
        // Provide helpful error message based on the issue
        if (errorMessage.includes('not configured') || errorMessage.includes('BUCKET')) {
          return res.status(500).json({ 
            error: 'Storage not configured',
            details: errorMessage,
            hint: 'Please configure S3 or DigitalOcean Spaces storage. Required variables: STORAGE_PROVIDER, S3_BUCKET_NAME (or SPACES_BUCKET), AWS_ACCESS_KEY_ID (or SPACES_KEY), AWS_SECRET_ACCESS_KEY (or SPACES_SECRET)'
          });
        }
        
        return res.status(500).json({ 
          error: 'Failed to upload image',
          details: errorMessage,
          hint: 'Check storage configuration and credentials'
        });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description || null);
    }
    if (data.point_cost !== undefined) {
      updates.push(`point_cost = $${paramIndex++}`);
      values.push(data.point_cost);
    }
    if (data.stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramIndex++}`);
      values.push(data.stock_quantity);
    }
    if (data.active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(data.active);
    }
    if (req.file) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(imageUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(itemId);

    const result = await pool.query(
      `UPDATE points_shop_items
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, description, point_cost, image_url, stock_quantity, active, created_at, updated_at`,
      values
    );

    res.json({ item: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update shop item error:', error);
    res.status(500).json({ error: 'Failed to update shop item' });
  }
});

// Delete shop item (hard delete - permanently removes from database)
router.delete('/items/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);

    // Check if item exists
    const checkResult = await pool.query(
      'SELECT id FROM points_shop_items WHERE id = $1',
      [itemId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Hard delete - permanently remove from database
    await pool.query(
      'DELETE FROM points_shop_items WHERE id = $1',
      [itemId]
    );

    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    console.error('Delete shop item error:', error);
    res.status(500).json({ error: 'Failed to delete shop item' });
  }
});

export default router;
