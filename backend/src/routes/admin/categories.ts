import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth.js';
import pool from '../../db/index.js';
import { z } from 'zod';
import {
  getCategories,
  getCategoryById,
  getCategoriesWithProductCounts,
  createCategory,
  updateCategory,
  deleteCategory,
  syncCategoriesFromSquare,
  getProductsByCategory,
} from '../../services/categoryService.js';

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

// Get all categories (admin - includes inactive)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await getCategoriesWithProductCounts(!includeInactive);
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category schema
const createCategorySchema = z.object({
  square_category_id: z.string().nullable().optional(),
  name: z.string().min(1),
  display_name: z.string().min(1),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().optional(),
});

// Create category
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await createCategory(data);
    res.status(201).json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category schema
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  display_name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().optional(),
});

// Update category
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = updateCategorySchema.parse(req.body);
    const category = await updateCategory(id, data);
    res.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await deleteCategory(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Sync categories from Square
router.post('/sync', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await syncCategoriesFromSquare();
    res.json({
      message: 'Categories synced successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error syncing categories:', error);
    res.status(500).json({ error: 'Failed to sync categories from Square' });
  }
});

// Get products in category
router.get('/:id/products', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const products = await getProductsByCategory(id);
    res.json({ products });
  } catch (error) {
    if (error instanceof Error && error.message === 'Category not found') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Error fetching category products:', error);
    res.status(500).json({ error: 'Failed to fetch category products' });
  }
});

export default router;
