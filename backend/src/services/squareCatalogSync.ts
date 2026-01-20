import { squareApiRequest } from './squareService.js';

// Type definitions for Square Catalog API responses (snake_case from API)
interface CatalogObject {
  type: string;
  id: string;
  item_data?: {
    name?: string;
    description?: string;
    image_ids?: string[];
    variations?: CatalogObject[];
    categories?: string[]; // Array of category IDs (new format)
    category_id?: string; // Single category ID (deprecated but may still be used)
  };
  image_data?: {
    url?: string;
  };
  item_variation_data?: {
    item_id?: string;
    price_money?: {
      amount?: number;
      currency?: string;
    };
  };
  category_data?: {
    name?: string;
  };
}

export interface CatalogCategory {
  id: string;
  name: string;
}

export interface LEDProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  categoryIds?: string[]; // Array of category IDs this product belongs to
  attributes: {
    voltage?: string;
    ledType?: string;
    waterproofRating?: string;
    wattPerMeter?: number;
    maxRunMeters?: number;
    cutIncrementMm?: number;
    environment?: 'indoor' | 'outdoor' | 'both';
  };
}

export async function listCatalogItems(): Promise<LEDProduct[]> {
  try {
    // Use simple list endpoint - most reliable approach
    const allObjects: CatalogObject[] = [];
    let cursor: string | null = null;

    do {
      let url = `/v2/catalog/list?types=ITEM,ITEM_VARIATION,IMAGE`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }
      
      const response = await squareApiRequest('GET', url) as any;
      const objects = response.objects || [];
      allObjects.push(...objects);
      cursor = response.cursor || null;
    } while (cursor);

    if (allObjects.length === 0) {
      return [];
    }

    const items: LEDProduct[] = [];
    const images = new Map<string, string>();
    const variations = new Map<string, CatalogObject>();

    // Build image map and variation map
    allObjects.forEach((obj: CatalogObject) => {
      if (obj.type === 'IMAGE' && obj.image_data) {
        images.set(obj.id, obj.image_data.url || '');
      } else if (obj.type === 'ITEM_VARIATION' && obj.item_variation_data) {
        variations.set(obj.id, obj);
      }
    });

    // Process items
    allObjects.forEach((obj: CatalogObject) => {
      if (obj.type === 'ITEM' && obj.item_data) {
        const itemData = obj.item_data;
        const imageIds = itemData.image_ids || [];
        const imageUrl = imageIds.length > 0 ? images.get(imageIds[0]) : undefined;

        // Get first variation for pricing
        let price: number | undefined;
        const variationObjs = itemData.variations || [];
        if (variationObjs.length > 0 && Array.isArray(variationObjs)) {
          const firstVariation = variationObjs[0] as CatalogObject;
          if (firstVariation?.item_variation_data?.price_money) {
            const money = firstVariation.item_variation_data.price_money;
            price = money.amount ? Number(money.amount) / 100 : undefined;
          }
        }

        // Extract custom attributes from description
        const attributes: LEDProduct['attributes'] = {
          environment: 'both',
        };

        if (itemData.description) {
          const desc = itemData.description.toLowerCase();
          if (desc.includes('indoor')) attributes.environment = 'indoor';
          if (desc.includes('outdoor')) attributes.environment = 'outdoor';
          if (desc.includes('12v')) attributes.voltage = '12V';
          if (desc.includes('24v')) attributes.voltage = '24V';
        }

        // Handle both new categories array and deprecated category_id field
        // Square API may return categories as objects with an 'id' property or as strings
        let categoryIds: string[] = [];
        if (itemData.categories && Array.isArray(itemData.categories)) {
          categoryIds = itemData.categories.map((cat: any) => {
            // If it's already a string, use it
            if (typeof cat === 'string') {
              return cat;
            }
            // If it's an object, extract the id property
            if (cat && typeof cat === 'object' && cat.id) {
              return typeof cat.id === 'string' ? cat.id : String(cat.id);
            }
            // Fallback: try to convert to string
            return String(cat);
          }).filter((id: string) => id && id !== 'undefined' && id !== 'null');
        } else if (itemData.category_id) {
          // Handle deprecated single category_id field
          const catId = itemData.category_id;
          if (typeof catId === 'string') {
            categoryIds = [catId];
          } else if (catId && typeof catId === 'object' && catId.id) {
            categoryIds = [typeof catId.id === 'string' ? catId.id : String(catId.id)];
          } else {
            categoryIds = [String(catId)];
          }
        }

        items.push({
          id: obj.id,
          name: itemData.name || 'Unnamed Product',
          description: itemData.description || undefined,
          imageUrl: imageUrl || undefined,
          price,
          categoryIds,
          attributes,
        });
      }
    });

    return items;
  } catch (error) {
    console.error('Error fetching Square catalog:', error);
    throw error;
  }
}

export async function getCatalogItem(itemId: string): Promise<LEDProduct | null> {
  try {
    // Use direct REST API call
    const response = await squareApiRequest('POST', '/v2/catalog/batch-retrieve', {
      object_ids: [itemId],
      include_related_objects: true,
    }) as any;

    const objects = response.objects || [];
    const relatedObjects = response.related_objects || [];

    if (objects.length === 0) {
      return null;
    }

    const obj = objects[0];
    if (obj.type !== 'ITEM' || !obj.item_data) {
      return null;
    }

    const itemData = obj.item_data;
    const imageUrl = itemData.image_ids && itemData.image_ids.length > 0
      ? relatedObjects.find((o: CatalogObject) => o.id === itemData.image_ids![0] && o.type === 'IMAGE')?.image_data?.url
      : undefined;

    let price: number | undefined;
    if (itemData.variations && Array.isArray(itemData.variations) && itemData.variations.length > 0) {
      const variation = itemData.variations[0] as CatalogObject;
      if (variation?.item_variation_data?.price_money) {
        const money = variation.item_variation_data.price_money;
        price = money.amount ? Number(money.amount) / 100 : undefined;
      }
    }

    const attributes: LEDProduct['attributes'] = {
      environment: 'both',
    };

    if (itemData.description) {
      const desc = itemData.description.toLowerCase();
      if (desc.includes('indoor')) attributes.environment = 'indoor';
      if (desc.includes('outdoor')) attributes.environment = 'outdoor';
      if (desc.includes('12v')) attributes.voltage = '12V';
      if (desc.includes('24v')) attributes.voltage = '24V';
    }

    // Handle both new categories array and deprecated category_id field
    // Square API may return categories as objects with an 'id' property or as strings
    let categoryIds: string[] = [];
    if (itemData.categories && Array.isArray(itemData.categories)) {
      categoryIds = itemData.categories.map((cat: any) => {
        // If it's already a string, use it
        if (typeof cat === 'string') {
          return cat;
        }
        // If it's an object, extract the id property
        if (cat && typeof cat === 'object' && cat.id) {
          return typeof cat.id === 'string' ? cat.id : String(cat.id);
        }
        // Fallback: try to convert to string
        return String(cat);
      }).filter((id: string) => id && id !== 'undefined' && id !== 'null');
    } else if (itemData.category_id) {
      // Handle deprecated single category_id field
      const catId = itemData.category_id;
      if (typeof catId === 'string') {
        categoryIds = [catId];
      } else if (catId && typeof catId === 'object' && catId.id) {
        categoryIds = [typeof catId.id === 'string' ? catId.id : String(catId.id)];
      } else {
        categoryIds = [String(catId)];
      }
    }

    return {
      id: obj.id,
      name: itemData.name || 'Unnamed Product',
      description: itemData.description || undefined,
      imageUrl: imageUrl || undefined,
      price,
      categoryIds,
      attributes,
    };
  } catch (error) {
    console.error('Error fetching catalog item:', error);
    return null;
  }
}

// Fetch all categories from Square
export async function listCatalogCategories(): Promise<CatalogCategory[]> {
  try {
    const allObjects: CatalogObject[] = [];
    let cursor: string | null = null;

    do {
      let url = `/v2/catalog/list?types=CATEGORY`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }
      
      const response = await squareApiRequest('GET', url) as any;
      const objects = response.objects || [];
      allObjects.push(...objects);
      cursor = response.cursor || null;
    } while (cursor);

    const categories: CatalogCategory[] = allObjects
      .filter((obj: CatalogObject) => obj.type === 'CATEGORY' && obj.category_data)
      .map((obj: CatalogObject) => ({
        id: obj.id,
        name: obj.category_data?.name || 'Unnamed Category',
      }));

    return categories;
  } catch (error) {
    console.error('Error fetching Square categories:', error);
    throw error;
  }
}

// Simple cache to avoid refetching all products repeatedly
let productsCache: { products: LEDProduct[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedProducts(): Promise<LEDProduct[]> {
  const now = Date.now();
  if (productsCache && (now - productsCache.timestamp) < CACHE_TTL) {
    return productsCache.products;
  }
  
  const products = await listCatalogItems();
  productsCache = { products, timestamp: now };
  return products;
}

// Fetch products by category ID
export async function listCatalogItemsByCategory(categoryId: string): Promise<LEDProduct[]> {
  try {
    const allProducts = await getCachedProducts();
    
    // Normalize category ID (remove # prefix if present for comparison)
    const normalizeId = (id: string) => id.replace(/^#+/, '');
    const normalizedCategoryId = normalizeId(categoryId);
    
    // Filter products that belong to this category
    const filtered = allProducts.filter(product => {
      if (!product.categoryIds || product.categoryIds.length === 0) {
        return false;
      }
      return product.categoryIds.some(catId => {
        const normalizedCatId = normalizeId(catId);
        // Match with or without # prefix
        return normalizedCatId === normalizedCategoryId || catId === categoryId;
      });
    });
    
    // Debug logging
    if (filtered.length === 0) {
      const productsWithCategories = allProducts.filter(p => p.categoryIds && p.categoryIds.length > 0);
      console.log(`[Category Filter] Category ID: ${categoryId} (normalized: ${normalizedCategoryId})`);
      console.log(`[Category Filter] Total products: ${allProducts.length}, Products with categories: ${productsWithCategories.length}`);
      if (productsWithCategories.length > 0) {
        const sampleCategories = productsWithCategories
          .slice(0, 5)
          .flatMap(p => p.categoryIds || [])
          .map(id => normalizeId(id));
        console.log(`[Category Filter] Sample normalized category IDs from products:`, [...new Set(sampleCategories)]);
      }
    }
    
    return filtered;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    // Clear cache on error
    productsCache = null;
    throw error;
  }
}

