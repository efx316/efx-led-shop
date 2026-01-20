import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth.js';
import pool from '../../db/index.js';
import { z } from 'zod';
import {
  assignProductToCategory,
  removeProductFromCategory,
  bulkAssignProductsToCategory,
  getProductCategories,
  getAllProductsWithCategories,
} from '../../services/categoryService.js';
import { listCatalogItems } from '../../services/squareCatalogSync.js';

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

// Get all products with category assignments
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const products = await getAllProductsWithCategories();
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product with category assignments
router.get('/:productId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    
    // Get product from Square
    const allProducts = await listCatalogItems();
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get category assignments
    const categories = await getProductCategories(productId);
    
    res.json({
      product: {
        ...product,
        categoryIds: categories.map(c => c.id),
      },
      categories,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Assign product to category schema
const assignProductSchema = z.object({
  categoryId: z.number(),
  isPrimary: z.boolean().optional(),
});

// Assign product to category
router.post('/:productId/categories', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const data = assignProductSchema.parse(req.body);
    
    await assignProductToCategory(productId, data.categoryId, data.isPrimary ?? false);
    
    res.json({ message: 'Product assigned to category successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error assigning product to category:', error);
    res.status(500).json({ error: 'Failed to assign product to category' });
  }
});

// Remove product from category
router.delete('/:productId/categories/:categoryId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, categoryId } = req.params;
    await removeProductFromCategory(productId, parseInt(categoryId));
    res.json({ message: 'Product removed from category successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Product-category mapping not found') {
      return res.status(404).json({ error: 'Product-category mapping not found' });
    }
    console.error('Error removing product from category:', error);
    res.status(500).json({ error: 'Failed to remove product from category' });
  }
});

// Bulk assign products schema
const bulkAssignSchema = z.object({
  productIds: z.array(z.string()),
  categoryId: z.number(),
});

// Bulk assign products to category
router.post('/bulk-assign', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = bulkAssignSchema.parse(req.body);
    const result = await bulkAssignProductsToCategory(data.productIds, data.categoryId);
    res.json({
      message: 'Bulk assignment completed',
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error bulk assigning products:', error);
    res.status(500).json({ error: 'Failed to bulk assign products' });
  }
});

export default router;
