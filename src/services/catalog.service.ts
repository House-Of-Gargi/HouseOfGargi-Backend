import { supabase } from '../db/supabase.js';
import { products as fallbackProducts, categories, Product } from '../db/catalog.js';

interface CatalogCache {
  data: Product[];
  cachedAt: number;
}

let catalogCache: CatalogCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

function mapProductRow(item: any): Product {
  return {
    id: item.slug || String(item.id),
    name: item.name,
    category: item.category,
    price: item.price_in_rupees || item.price || 0,
    region: item.region || 'India',
    artisanNote: item.artisan_note || item.artisanNote || 'Crafted by master weavers in India',
    fabric: item.fabric || item.material || 'Pure Silk',
    technique: item.craft_technique || item.technique || 'Handloom Weave',
    occasion: item.occasion || 'Bridal & Festive',
    description: item.description || `${item.name} handcrafted by master artisans.`,
    images:
      item.images && Array.isArray(item.images)
        ? item.images
        : [item.image_url || '/images/category-sarees.png'],
    inStock: item.stock !== undefined ? item.stock > 0 : true,
    featured: Boolean(item.is_featured ?? item.featured),
    isHidden: Boolean(item.is_hidden),
    productNumber: item.product_number,
    curationRank: item.curation_rank,
  };
}

export async function fetchLiveCatalog(): Promise<Product[]> {
  const now = Date.now();
  if (catalogCache && now - catalogCache.cachedAt < CACHE_TTL_MS) {
    return catalogCache.data;
  }

  try {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data && data.length > 0) {
      const mappedProducts: Product[] = data.map(mapProductRow);

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
  const feUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const secret = process.env.REVALIDATE_SECRET;
  fetch(`${feUrl}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ tag: 'products' }),
  }).catch(() => {});
}

export async function getCuratedCategories(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.id,
        description: c.description,
        imageUrl: c.image_url || '/images/category-sarees.png',
        displayOrder: c.display_order,
        isActive: c.is_active,
      }));
    }
  } catch (err) {
    console.warn('[CatalogService] Categories fetch fallback:', err);
  }
  return categories;
}

export async function getFeaturedCurations(limit = 6): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_hidden', false)
      .is('deleted_at', null)
      .order('total_units_sold', { ascending: false })
      .order('curation_rank', { ascending: true })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map(mapProductRow);
    }
  } catch (err) {
    console.warn('[CatalogService] Featured live fetch fallback:', err);
  }
  const all = await fetchLiveCatalog();
  return all.filter((p) => !p.isHidden).slice(0, limit);
}

export async function getNewArrivals(limit = 12): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_hidden', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map(mapProductRow);
    }
  } catch (err) {
    console.warn('[CatalogService] New arrivals live fetch fallback:', err);
  }
  const all = await fetchLiveCatalog();
  return all.filter((p) => !p.isHidden).slice(0, limit);
}
