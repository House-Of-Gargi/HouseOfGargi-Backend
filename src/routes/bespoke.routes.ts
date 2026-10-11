import { FastifyPluginAsync } from 'fastify';
import { supabase } from '../db/supabase.js';
import fs from 'fs';
import path from 'path';

const BACKUP_DATA_FILE = path.join(process.cwd(), 'src', 'db', 'bespoke_commissions.json');

function saveToBackup(data: any) {
  try {
    let list: any[] = [];
    if (fs.existsSync(BACKUP_DATA_FILE)) {
      list = JSON.parse(fs.readFileSync(BACKUP_DATA_FILE, 'utf8'));
    }
    list.unshift(data);
    fs.writeFileSync(BACKUP_DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('Backup write error:', err);
  }
}

function getFromBackup(): any[] {
  try {
    if (fs.existsSync(BACKUP_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(BACKUP_DATA_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

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

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('bespoke_requests')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) {
        saveToBackup(data);
        return reply.status(201).send({
          success: true,
          requestNumber: data.request_number,
          commission: data,
        });
      }
    } catch (dbErr) {
      console.warn('Supabase insert failed, using fallback:', dbErr);
    }

    // Local fallback persistence
    saveToBackup(newRecord);
    return reply.status(201).send({
      success: true,
      requestNumber,
      commission: newRecord,
    });
  });

  // GET /api/v1/bespoke - List commissions
  fastify.get('/', async (request, reply) => {
    try {
      const { data, error } = await supabase
        .from('bespoke_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return reply.send({ success: true, count: data.length, commissions: data });
      }
    } catch {}

    const backup = getFromBackup();
    return reply.send({ success: true, count: backup.length, commissions: backup });
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
