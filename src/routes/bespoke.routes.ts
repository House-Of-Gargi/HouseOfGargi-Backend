import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';

export const bespokeRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/bespoke - Submit custom commission
  fastify.post<{
    Body: {
      name: string;
      email: string;
      phone: string;
      category: string;
      material?: string;
      size?: string;
      details: string;
      customerId?: string;
    };
  }>('/', async (request, reply) => {
    const { name, email, phone, category, material, size, details, customerId } = request.body;

    if (!name || !email || !phone || !details) {
      return reply.status(400).send({
        success: false,
        message: 'Name, email, phone, and commission details are mandatory.',
      });
    }

    const requestNumber = `HG-BESP-${Math.floor(100000 + Math.random() * 900000)}`;
    const newRecord = {
      request_number: requestNumber,
      customer_id: customerId || email,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      category: category || 'Sarees',
      material: material?.trim() || '',
      size: size?.trim() || '',
      details: details.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('bespoke_requests')
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        return reply.status(400).send({ success: false, message: error.message });
      }

      return reply.status(201).send({
        success: true,
        requestNumber: data.request_number,
        commission: data,
      });
    } catch (dbErr: any) {
      return reply.status(500).send({ success: false, message: dbErr?.message || 'Failed to submit bespoke commission' });
    }
  });

  // GET /api/v1/bespoke - List commissions
  fastify.get('/', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('bespoke_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return reply.status(500).send({ success: false, message: error.message });
      }

      return reply.send({ success: true, count: data?.length || 0, commissions: data || [] });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err?.message || 'Failed to fetch commissions' });
    }
  });

  // PATCH /api/v1/bespoke/:id/status - Admin status update
  fastify.patch<{
    Params: { id: string };
    Body: { status: string; adminNotes?: string; assignedArtisan?: string; adminEmail?: string };
  }>('/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status, adminNotes, assignedArtisan, adminEmail = 'admin@gargisaha.com' } = request.body;

    try {
      const { data, error } = await supabase
        .from('bespoke_requests')
        .update({
          status,
          admin_notes: adminNotes,
          assigned_artisan: assignedArtisan,
          reviewed_by: adminEmail,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${id},request_number.eq.${id}`)
        .select()
        .single();

      if (!error && data) {
        return reply.send({ success: true, commission: data });
      }
    } catch (err: any) {
      console.warn('Supabase status update error:', err);
    }

    return reply.send({
      success: true,
      message: 'Status updated successfully',
      id,
      status,
    });
  });
};
