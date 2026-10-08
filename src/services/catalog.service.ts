import { supabase } from '../db/supabase.js';
import { products as fallbackProducts, categories, Product } from '../db/catalog.js';

interface CatalogCache {
  data: Product[];
  cachedAt: number;
}

let catalogCache: CatalogCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export async function fetchLiveCatalog(): Promise<Product[]> {
  const now = Date.now();
  if (catalogCache && now - catalogCache.cachedAt < CACHE_TTL_MS) {
    return catalogCache.data;
  }

  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      // Map Supabase columns to standard Product interface
      const mappedProducts: Product[] = data.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        category: item.category,
        price: item.price_in_rupees || item.price || 0,
        region: item.region || 'India',
        artisanNote: item.artisan_note || item.artisanNote || 'Crafted by master weavers in India',
        fabric: item.fabric || item.material || 'Pure Silk',
        technique: item.technique || 'Handloom Weave',
        occasion: item.occasion || 'Bridal & Festive',
        description: item.description || `${item.name} handcrafted by master artisans.`,
        images:
          item.images && Array.isArray(item.images)
            ? item.images
            : [item.image_url || '/images/category-sarees.png'],
        inStock: item.stock !== undefined ? item.stock > 0 : true,
        featured: item.featured ?? false,
      }));

      // Merge with fallback products to ensure complete catalog availability
      const combined = [...mappedProducts];
      for (const fp of fallbackProducts) {
        if (!combined.some((p) => p.name.toLowerCase() === fp.name.toLowerCase() || p.id === fp.id)) {
          combined.push(fp);
        }
      }

      catalogCache = {
        data: combined,
        cachedAt: now,
      };
      return combined;
    }
  } catch (err) {
    console.warn('[CatalogService] Supabase live fetch fallback:', err);
  }

  // Fallback to static catalog if DB is cold or empty
  catalogCache = {
    data: fallbackProducts,
    cachedAt: now,
  };
  return fallbackProducts;
}

export async function getFilteredProducts(filters: {
  category?: string;
  featured?: boolean;
  search?: string;
}): Promise<Product[]> {
  const all = await fetchLiveCatalog();
  let result = [...all];

  if (filters.category) {
    const target = filters.category.toLowerCase();
    result = result.filter((p) => p.category.toLowerCase() === target);
  }

  if (filters.featured !== undefined) {
    result = result.filter((p) => p.featured === filters.featured);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.technique.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function getProductById(id: string): Promise<Product | null> {
  const all = await fetchLiveCatalog();
  return all.find((p) => String(p.id) === String(id)) || null;
}

export function invalidateCatalogCache(): void {
  catalogCache = null;
}

export function getCuratedCategories() {
  return categories;
}
