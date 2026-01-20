import { Router, Request, Response } from 'express';
import { listCatalogItems, getCatalogItem, listCatalogCategories, listCatalogItemsByCategory } from '../services/squareCatalogSync.js';
import { squareClient } from '../services/squareService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import pool from '../db/index.js';

const router = Router();

// Test Square connection
router.get('/test', async (req: Request, res: Response) => {
  try {
    // Test with catalog API using direct REST call
    const { squareApiRequest } = await import('../services/squareService.js');
    const response = await squareApiRequest('GET', '/v2/catalog/list?types=ITEM') as { objects?: any[] };
    
    const objectCount = response.objects?.length || 0;
    
    res.json({
      success: true,
      message: 'Square API connection successful',
      catalogItemCount: objectCount,
      tokenLength: process.env.SQUARE_ACCESS_TOKEN?.length || 0,
      environment: process.env.SQUARE_ENVIRONMENT || 'not set',
      locationId: process.env.SQUARE_LOCATION_ID || 'not set',
    });
  } catch (error: any) {
    console.error('Square API test error:', error);
    const errorDetails = error.errors || error.response?.errors || null;
    const errorMessage = error.message || error.response?.errors?.[0]?.detail || 'Unknown error';
    
    res.status(500).json({
      success: false,
      message: 'Square API connection failed',
      error: errorMessage,
      details: errorDetails,
      environment: process.env.SQUARE_ENVIRONMENT || 'not set',
    });
  }
});

// Get all LED products (with database category assignments)
// Only returns products that have been assigned to categories in the admin panel
router.get('/products', async (req: Request, res: Response) => {
  try {
    // Get all products assigned to categories in the database
    const result = await pool.query(
      'SELECT DISTINCT product_id FROM product_categories'
    );
    const assignedProductIds = new Set(result.rows.map((row: any) => row.product_id));
    
    // If no products are assigned, return empty array
    if (assignedProductIds.size === 0) {
      return res.json([]);
    }
    
    // Fetch all products from Square
    const allProducts = await listCatalogItems();
    
    // Filter to only products that have been assigned to categories
    const assignedProducts = allProducts.filter(product => 
      assignedProductIds.has(product.id)
    );
    
    // Enhance products with database category IDs
    try {
      const { getAllProductsWithCategories } = await import('../services/categoryService.js');
      const productsWithDbCategories = await getAllProductsWithCategories();
      
      // Merge Square categoryIds with database categoryIds
      const enhancedProducts = assignedProducts.map(product => {
        const dbProduct = productsWithDbCategories.find(p => p.id === product.id);
        const dbCategoryIds = dbProduct?.dbCategoryIds || [];
        
        // Use DB category IDs (as strings) for frontend compatibility
        return {
          ...product,
          categoryIds: dbCategoryIds.map(id => id.toString()),
        };
      });
      
      return res.json(enhancedProducts);
    } catch (dbError) {
      console.warn('Database category lookup failed, returning products without category mapping:', dbError);
      // Fallback: return assigned products with their Square category IDs
      return res.json(assignedProducts);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getCatalogItem(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get all categories (public - active only)
router.get('/categories', async (req: Request, res: Response) => {
  try {
    // Use database categories if available, fallback to Square
    try {
      const { getCategories } = await import('../services/categoryService.js');
      const categories = await getCategories(true); // active only
      if (categories.length > 0) {
        return res.json(categories.map(cat => ({
          id: cat.id.toString(),
          name: cat.display_name,
        })));
      }
    } catch (dbError) {
      console.warn('Database categories not available, falling back to Square:', dbError);
    }
    
    // Fallback to Square categories
    const categories = await listCatalogCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get products by category (public)
router.get('/categories/:categoryId/products', async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId;
    
    // Try database category first (if categoryId is numeric, it's a DB ID)
    const dbCategoryId = parseInt(categoryId);
    if (!isNaN(dbCategoryId)) {
      try {
        const { getProductsByCategory } = await import('../services/categoryService.js');
        const products = await getProductsByCategory(dbCategoryId);
        return res.json(products);
      } catch (dbError) {
        console.warn('Database category lookup failed, trying Square:', dbError);
      }
    }
    
    // Fallback to Square category ID
    console.log(`[API] Fetching products for Square category: ${categoryId}`);
    const products = await listCatalogItemsByCategory(categoryId);
    console.log(`[API] Found ${products.length} products for category ${categoryId}`);
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products by category:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch products by category',
      message: error.message,
      details: error.toString()
    });
  }
});

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

// Diagnostic endpoint for Square categories (admin only)
router.get('/categories/diagnostic', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { listCatalogItems } = await import('../services/squareCatalogSync.js');
    const { listCatalogCategories } = await import('../services/squareCatalogSync.js');
    
    // Fetch categories from Square
    const squareCategories = await listCatalogCategories();
    
    // Fetch all products
    const allProducts = await listCatalogItems();
    
    // Analyze category data
    const productsWithCategories = allProducts.filter(p => p.categoryIds && p.categoryIds.length > 0);
    const productsWithoutCategories = allProducts.filter(p => !p.categoryIds || p.categoryIds.length === 0);
    
    // Get unique category IDs from products
    const categoryIdsFromProducts = new Set<string>();
    allProducts.forEach(p => {
      if (p.categoryIds) {
        p.categoryIds.forEach(id => categoryIdsFromProducts.add(id));
      }
    });
    
    // Sample products with categories
    const sampleProducts = productsWithCategories.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      categoryIds: p.categoryIds,
    }));
    
    res.json({
      squareCategories: {
        total: squareCategories.length,
        categories: squareCategories,
      },
      products: {
        total: allProducts.length,
        withCategories: productsWithCategories.length,
        withoutCategories: productsWithoutCategories.length,
      },
      categoryIdsFromProducts: Array.from(categoryIdsFromProducts),
      sampleProducts,
      summary: {
        squareCategoryCount: squareCategories.length,
        uniqueCategoryIdsInProducts: categoryIdsFromProducts.size,
        productsWithCategories: productsWithCategories.length,
        productsWithoutCategories: productsWithoutCategories.length,
      },
    });
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      error: 'Failed to run diagnostic',
      message: error.message,
      details: error.toString(),
    });
  }
});

export default router;

