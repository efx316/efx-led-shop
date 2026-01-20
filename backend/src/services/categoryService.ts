import pool from '../db/index.js';
import { listCatalogCategories, listCatalogItems, LEDProduct } from './squareCatalogSync.js';

export interface Category {
  id: number;
  square_category_id: string | null;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryWithProductCount extends Category {
  product_count: number;
}

// Get all categories (active only for public, all for admin)
export async function getCategories(activeOnly: boolean = true): Promise<Category[]> {
  try {
    let query = 'SELECT * FROM categories';
    const params: any[] = [];
    
    if (activeOnly) {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY display_order ASC, name ASC';
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Get category by ID
export async function getCategoryById(id: number): Promise<Category | null> {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
}

// Get categories with product counts
export async function getCategoriesWithProductCounts(activeOnly: boolean = true): Promise<CategoryWithProductCount[]> {
  try {
    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
    `;
    const params: any[] = [];
    
    if (activeOnly) {
      query += ' WHERE c.is_active = true';
    }
    
    query += ' GROUP BY c.id ORDER BY c.display_order ASC, c.name ASC';
    
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      product_count: parseInt(row.product_count) || 0,
    }));
  } catch (error) {
    console.error('Error fetching categories with counts:', error);
    throw error;
  }
}

// Create category
export async function createCategory(data: {
  square_category_id?: string | null;
  name: string;
  display_name: string;
  description?: string | null;
  is_active?: boolean;
  display_order?: number;
}): Promise<Category> {
  try {
    const result = await pool.query(
      `INSERT INTO categories (square_category_id, name, display_name, description, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.square_category_id || null,
        data.name,
        data.display_name,
        data.description || null,
        data.is_active ?? true,
        data.display_order ?? 0,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Update category
export async function updateCategory(
  id: number,
  data: {
    name?: string;
    display_name?: string;
    description?: string | null;
    is_active?: boolean;
    display_order?: number;
  }
): Promise<Category> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.display_name !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(data.display_name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(data.display_order);
    }

    if (updates.length === 0) {
      const category = await getCategoryById(id);
      if (!category) throw new Error('Category not found');
      return category;
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE categories 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Category not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

// Delete category
export async function deleteCategory(id: number): Promise<void> {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new Error('Category not found');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// Sync categories from Square
export async function syncCategoriesFromSquare(): Promise<{ created: number; updated: number }> {
  try {
    const squareCategories = await listCatalogCategories();
    let created = 0;
    let updated = 0;

    for (const squareCat of squareCategories) {
      // Check if category exists by square_category_id
      const existing = await pool.query(
        'SELECT id FROM categories WHERE square_category_id = $1',
        [squareCat.id]
      );

      if (existing.rows.length > 0) {
        // Update existing
        await pool.query(
          `UPDATE categories 
           SET name = $1, display_name = $2, updated_at = CURRENT_TIMESTAMP
           WHERE square_category_id = $3`,
          [squareCat.name, squareCat.name, squareCat.id]
        );
        updated++;
      } else {
        // Create new
        await pool.query(
          `INSERT INTO categories (square_category_id, name, display_name, is_active, display_order)
           VALUES ($1, $2, $3, true, 0)`,
          [squareCat.id, squareCat.name, squareCat.name]
        );
        created++;
      }
    }

    return { created, updated };
  } catch (error) {
    console.error('Error syncing categories from Square:', error);
    throw error;
  }
}

// Get products by category ID
export async function getProductsByCategory(categoryId: number): Promise<LEDProduct[]> {
  try {
    // First, get the category
    const category = await getCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Get product IDs from database mappings
    const mappingResult = await pool.query(
      'SELECT product_id FROM product_categories WHERE category_id = $1',
      [categoryId]
    );
    const mappedProductIds = new Set(mappingResult.rows.map((r: any) => r.product_id));

    // Get all products from Square
    const allProducts = await listCatalogItems();

    // Filter products:
    // 1. If we have manual mappings, use those
    // 2. Otherwise, fall back to Square category IDs if category has square_category_id
    if (mappedProductIds.size > 0) {
      return allProducts.filter(p => mappedProductIds.has(p.id));
    } else if (category.square_category_id) {
      // Fall back to Square category assignment
      return allProducts.filter(p => 
        p.categoryIds?.some(catId => {
          // Normalize IDs (handle # prefix)
          const normalize = (id: string) => id.replace(/^#+/, '');
          return normalize(catId) === normalize(category.square_category_id!) || 
                 catId === category.square_category_id;
        })
      );
    }

    return [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
}

// Assign product to category
export async function assignProductToCategory(
  productId: string,
  categoryId: number,
  isPrimary: boolean = false
): Promise<void> {
  try {
    // Check if assignment already exists
    const existing = await pool.query(
      'SELECT id FROM product_categories WHERE product_id = $1 AND category_id = $2',
      [productId, categoryId]
    );

    if (existing.rows.length > 0) {
      // Update existing
      await pool.query(
        'UPDATE product_categories SET is_primary = $1 WHERE product_id = $2 AND category_id = $3',
        [isPrimary, productId, categoryId]
      );
    } else {
      // Create new
      await pool.query(
        'INSERT INTO product_categories (product_id, category_id, is_primary) VALUES ($1, $2, $3)',
        [productId, categoryId, isPrimary]
      );
    }
  } catch (error) {
    console.error('Error assigning product to category:', error);
    throw error;
  }
}

// Remove product from category
export async function removeProductFromCategory(productId: string, categoryId: number): Promise<void> {
  try {
    const result = await pool.query(
      'DELETE FROM product_categories WHERE product_id = $1 AND category_id = $2',
      [productId, categoryId]
    );
    if (result.rowCount === 0) {
      throw new Error('Product-category mapping not found');
    }
  } catch (error) {
    console.error('Error removing product from category:', error);
    throw error;
  }
}

// Bulk assign products to category
export async function bulkAssignProductsToCategory(
  productIds: string[],
  categoryId: number
): Promise<{ assigned: number; errors: number }> {
  try {
    let assigned = 0;
    let errors = 0;

    for (const productId of productIds) {
      try {
        await assignProductToCategory(productId, categoryId, false);
        assigned++;
      } catch (error) {
        console.error(`Error assigning product ${productId}:`, error);
        errors++;
      }
    }

    return { assigned, errors };
  } catch (error) {
    console.error('Error bulk assigning products:', error);
    throw error;
  }
}

// Get product with all category assignments
export async function getProductCategories(productId: string): Promise<Category[]> {
  try {
    const result = await pool.query(
      `SELECT c.* 
       FROM categories c
       JOIN product_categories pc ON c.id = pc.category_id
       WHERE pc.product_id = $1
       ORDER BY pc.is_primary DESC, c.display_order ASC`,
      [productId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching product categories:', error);
    throw error;
  }
}

// Get all products with their category assignments
export async function getAllProductsWithCategories(): Promise<Array<LEDProduct & { categoryIds: string[]; categoryNames: string[]; dbCategoryIds: number[] }>> {
  try {
    const products = await listCatalogItems();
    
    // Fetch Square categories to build ID -> name map
    const squareCategories = await listCatalogCategories();
    const categoryIdToNameMap = new Map<string, string>();
    const normalizeId = (id: string) => id.replace(/^#+/, '').trim();
    
    squareCategories.forEach(cat => {
      // Store multiple variations of the ID
      categoryIdToNameMap.set(cat.id, cat.name);
      const normalizedId = normalizeId(cat.id);
      if (normalizedId !== cat.id) {
        categoryIdToNameMap.set(normalizedId, cat.name);
      }
      // Also store with # prefix if it doesn't have one
      if (!cat.id.startsWith('#')) {
        categoryIdToNameMap.set(`#${cat.id}`, cat.name);
      }
    });
    
    // Get all product-category mappings
    const mappingsResult = await pool.query(
      'SELECT product_id, category_id FROM product_categories'
    );
    
    // Build map of product_id -> database category_ids
    const productCategoryMap = new Map<string, number[]>();
    mappingsResult.rows.forEach((row: any) => {
      if (!productCategoryMap.has(row.product_id)) {
        productCategoryMap.set(row.product_id, []);
      }
      productCategoryMap.get(row.product_id)!.push(row.category_id);
    });
    
    // Add database category IDs and Square category names to products
    return products.map(product => {
      const categoryNames: string[] = [];
      if (product.categoryIds && Array.isArray(product.categoryIds)) {
        product.categoryIds.forEach(catId => {
          if (catId && typeof catId === 'string') {
            const normalizedId = normalizeId(catId);
            // Try multiple lookup strategies
            const name = categoryIdToNameMap.get(catId) || 
                        categoryIdToNameMap.get(normalizedId) ||
                        categoryIdToNameMap.get(`#${catId}`) ||
                        categoryIdToNameMap.get(`#${normalizedId}`);
            if (name && !categoryNames.includes(name)) {
              categoryNames.push(name);
            }
          }
        });
      }
      
      return {
        ...product,
        categoryNames,
        dbCategoryIds: productCategoryMap.get(product.id) || [],
      };
    });
  } catch (error) {
    console.error('Error fetching products with categories:', error);
    throw error;
  }
}
