import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';
import { recordAuditLog } from '../lib/audit.js';
import { invalidateCatalogCache } from '../services/catalog.service.js';

export const sellerRoutes: FastifyPluginAsync = async (fastify) => {
  // Enforce artisan, admin, or super_admin role on artisan routes (except public applications)
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url.includes('/applications') && request.method === 'POST') {
      return;
    }
    return fastify.requireRole('artisan', 'admin', 'super_admin')(request, reply);
  });

  // ==========================================
  // 1. PUBLIC ARTISAN ONBOARDING APPLICATION
  // ==========================================
  fastify.post<{
    Body: {
      name: string;
      email: string;
      phone: string;
      typeOfArt: string;
      state: string;
      answers?: Record<string, any>;
      agreedChildLabor?: boolean;
      agreedInspection?: boolean;
      signature?: string;
    };
  }>(
    '/applications',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
        },
      },
    },
    async (request, reply) => {
      const {
        name,
        email,
        phone,
        typeOfArt,
        state,
        answers = {},
        agreedChildLabor = true,
        agreedInspection = true,
        signature = '',
      } = request.body;

      if (!name || !email || !phone || !typeOfArt) {
        return reply.status(400).send({
          success: false,
          message: 'Required application fields missing (name, email, phone, craft type).',
        });
      }

      const cleanEmail = email.toLowerCase().trim();
      const appNumber = `HG-ART-${Math.floor(100000 + Math.random() * 900000)}`;

      try {
        const { data, error } = await supabase
          .from('artisan_applications')
          .insert({
            application_number: appNumber,
            name,
            email: cleanEmail,
            phone,
            type_of_art: typeOfArt,
            state: state || 'India',
            answers,
            agreed_child_labor: Boolean(agreedChildLabor),
            agreed_inspection: Boolean(agreedInspection),
            signature: signature || name,
            signature_date: new Date().toISOString().split('T')[0],
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }

        return reply.status(201).send({
          success: true,
          message: 'Your artisan application has been officially submitted to House of Gargi curators.',
          applicationNumber: appNumber,
          application: data,
        });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err?.message || 'Application submission failed' });
      }
    }
  );

  // ==========================================
  // 2. ARTISAN PROFILE & TELEMETRY
  // ==========================================
  // GET /api/v1/artisan/me
  fastify.get('/me', async (request, reply) => {
    const user = request.user as { email?: string; role?: string } | undefined;
    const email = user?.email?.toLowerCase().trim();

    if (!email) {
      return reply.status(401).send({ success: false, message: 'Unauthorized session' });
    }

    try {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select('*')
        .eq('user_email', email)
        .maybeSingle();

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({
        success: true,
        artisan: data || {
          user_email: email,
          full_name: email.split('@')[0],
          craft_specialty: 'Handloom Heritage',
          region: 'India',
          is_verified: false,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Profile fetch failed' });
    }
  });

  // PATCH /api/v1/artisan/me
  fastify.patch<{ Body: Record<string, any> }>('/me', async (request, reply) => {
    const user = request.user as { email?: string } | undefined;
    const email = user?.email?.toLowerCase().trim();

    if (!email) {
      return reply.status(401).send({ success: false, message: 'Unauthorized session' });
    }

    const updates = { ...request.body };
    delete updates.id;
    delete updates.user_email;
    delete updates.is_verified;
    updates.updated_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .update(updates)
        .eq('user_email', email)
        .select()
        .maybeSingle();

      if (error) {
        return reply.status(400).send({ success: false, message: error.message });
      }

      return reply.send({ success: true, artisan: data });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Profile update failed' });
    }
  });

  // GET /api/v1/artisan/analytics
  fastify.get('/analytics', async (request, reply) => {
    const user = request.user as { email?: string; role?: string } | undefined;
    const email = user?.email?.toLowerCase().trim();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    try {
      let query = supabase.from('products').select('*').is('deleted_at', null);
      if (!isAdmin && email) {
        query = query.eq('artisan_email', email);
      }

      const { data: prods, error } = await query;
      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      const productsList = prods || [];
      const totalInventoryValue = productsList.reduce((acc, p: any) => acc + (p.price_in_rupees || p.price || 0) * (p.stock || 1), 0);
      const totalUnits = productsList.reduce((acc, p: any) => acc + (p.stock || 0), 0);
      const liveCreations = productsList.filter((p: any) => !p.is_hidden).length;

      const categoryDistribution = [
        { name: 'Sarees', count: productsList.filter((p: any) => p.category === 'sarees').length },
        { name: 'Lehengas', count: productsList.filter((p: any) => p.category === 'lehengas').length },
        { name: 'Kurta Sets', count: productsList.filter((p: any) => p.category === 'kurta-sets').length },
        { name: 'Accessories', count: productsList.filter((p: any) => p.category === 'accessories').length },
        { name: 'Bespoke', count: productsList.filter((p: any) => p.category === 'bespoke').length },
      ];

      return reply.send({
        success: true,
        analytics: {
          totalCreations: productsList.length,
          liveCreations,
          totalInventoryUnits: totalUnits,
          totalInventoryValue,
          categoryDistribution,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Analytics computation failed' });
    }
  });

  // ==========================================
  // 3. ARTISAN PRODUCTS CRUD
  // ==========================================
  // GET /api/v1/artisan/products
  fastify.get('/products', async (request, reply) => {
    const user = request.user as { email?: string; role?: string } | undefined;
    const email = user?.email?.toLowerCase().trim();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    try {
      let query = supabase.from('products').select('*').is('deleted_at', null);
      if (!isAdmin && email) {
        query = query.eq('artisan_email', email);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({
        success: true,
        count: data?.length || 0,
        products: data || [],
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Products fetch failed' });
    }
  });

  // POST /api/v1/artisan/products
  fastify.post<{ Body: Record<string, any> }>('/products', async (request, reply) => {
    const user = request.user as { email?: string } | undefined;
    const email = user?.email?.toLowerCase().trim();

    const {
      name,
      category,
      price,
      stock = 5,
      description = '',
      images = ['/images/category-sarees.png'],
      fabric = 'Pure Silk',
      technique = 'Handloom Heritage',
      region = 'India',
      occasion = 'Festive & Bridal',
    } = request.body;

    if (!name || !category || !price) {
      return reply.status(400).send({ success: false, message: 'Name, category, and price are required.' });
    }

    const productNumber = `ART-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          category: category.toLowerCase().trim(),
          price_in_rupees: Number(price),
          price: Number(price),
          stock: Number(stock),
          description,
          images: Array.isArray(images) ? images : [images],
          fabric,
          technique,
          region,
          occasion,
          product_number: productNumber,
          artisan_email: email,
          is_hidden: false,
          curation_rank: 99,
          total_units_sold: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return reply.status(400).send({ success: false, message: error.message });
      }

      invalidateCatalogCache();
      await recordAuditLog(request, 'ARTISAN_CREATE_PRODUCT', data.id, { productNumber, name, price });

      return reply.status(201).send({
        success: true,
        message: 'Artisanal creation listed successfully.',
        product: data,
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Product creation failed' });
    }
  });

  // PATCH /api/v1/artisan/products/:id/visibility
  fastify.patch<{ Params: { id: string }; Body: { isHidden?: boolean; hidden?: boolean } }>(
    '/products/:id/visibility',
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user as { email?: string; role?: string } | undefined;
      const email = user?.email?.toLowerCase().trim();
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isHidden = request.body.isHidden !== undefined ? Boolean(request.body.isHidden) : Boolean(request.body.hidden);

      try {
        let query = supabase
          .from('products')
          .update({ is_hidden: isHidden, updated_at: new Date().toISOString() })
          .or(`id.eq.${id},slug.eq.${id}`);

        if (!isAdmin && email) {
          query = query.eq('artisan_email', email);
        }

        const { data, error } = await query.select().maybeSingle();
        if (error) {
          return reply.status(400).send({ success: false, message: error.message });
        }
        if (!data) {
          return reply.status(404).send({ success: false, message: 'Product not found or not owned by you.' });
        }

        invalidateCatalogCache();
        await recordAuditLog(request, 'ARTISAN_TOGGLE_VISIBILITY', id, { is_hidden: isHidden });

        return reply.send({ success: true, product: data, isHidden });
      } catch (err: any) {
        return reply.status(500).send({ success: false, message: err?.message || 'Visibility toggle failed' });
      }
    }
  );

  // DELETE /api/v1/artisan/products/:id (Soft-delete)
  fastify.delete<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const { id } = request.params;
    const user = request.user as { email?: string; role?: string } | undefined;
    const email = user?.email?.toLowerCase().trim();
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    try {
      let query = supabase
        .from('products')
        .update({
          deleted_at: new Date().toISOString(),
          is_hidden: true,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},slug.eq.${id}`);

      if (!isAdmin && email) {
        query = query.eq('artisan_email', email);
      }

      const { data, error } = await query.select().maybeSingle();
      if (error) {
        return reply.status(400).send({ success: false, message: error.message });
      }
      if (!data) {
        return reply.status(404).send({ success: false, message: 'Product not found or not owned by you.' });
      }

      invalidateCatalogCache();
      await recordAuditLog(request, 'ARTISAN_DELETE_PRODUCT', id);

      return reply.send({ success: true, message: 'Product soft-deleted successfully.', product: data });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Product deletion failed' });
    }
  });
};
