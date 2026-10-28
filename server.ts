import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  seedDatabaseIfEmpty,
  fetchOfficials,
  fetchComplaints,
  createComplaintInDb,
  updateComplaintStatusInDb,
  assignOfficialInDb,
  resolveComplaintInDb,
  escalateComplaintInDb,
  fetchNotifications,
  createNotificationInDb,
  markNotificationAsReadInDb,
  fetchComplaintById,
  addAttachmentInDb,
  fetchDatabaseStats,
} from './src/db/queries.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { createPool, isPostgresConfigured } from './src/db/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;

  app.use(express.json({ limit: '10mb' }));

  // Seed PostgreSQL database with initial officials, complaints, and audit entries if empty
  if (isPostgresConfigured) {
    await seedDatabaseIfEmpty();
  } else {
    console.info('PostgreSQL API is not configured. The frontend retains its existing Supabase connection.');
  }

  // API Routes powered by PostgreSQL via Drizzle ORM
  app.get('/api/health', async (_req, res) => {
    res.json({
      status: 'ok',
      database: isPostgresConfigured ? 'configured (connectivity not checked)' : 'not_configured',
      engine: 'Drizzle ORM',
    });
  });

  app.use('/api', (_req, res, next) => {
    if (!isPostgresConfigured) {
      res.status(503).json({
        error: 'PostgreSQL API is not configured. Set SQL_HOST, SQL_USER, SQL_PASSWORD, and SQL_DB_NAME. The frontend uses its existing Supabase connection separately.',
      });
      return;
    }
    next();
  });

  app.get('/api/officials', async (_req, res) => {
    try {
      const officials = await fetchOfficials();
      res.json(officials);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch officials' });
    }
  });

  app.get('/api/complaints', async (_req, res) => {
    try {
      const complaints = await fetchComplaints();
      res.json(complaints);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch complaints' });
    }
  });

  app.get('/api/complaints/:id', async (req, res) => {
    try {
      const complaint = await fetchComplaintById(req.params.id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }
      res.json(complaint);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch complaint' });
    }
  });

  app.post('/api/complaints/:id/attachments', async (req, res) => {
    try {
      const saved = await addAttachmentInDb(req.params.id, req.body);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to add attachment' });
    }
  });

  app.get('/api/database/stats', async (_req, res) => {
    try {
      const stats = await fetchDatabaseStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch database stats' });
    }
  });

  app.post('/api/admin/sql', async (req, res) => {
    try {
      const { sql } = req.body;
      if (!sql || typeof sql !== 'string') {
        return res.status(400).json({ error: 'SQL query string required' });
      }
      const pool = createPool();
      const result = await pool.query(sql);
      res.json({
        command: result.command,
        rowCount: result.rowCount,
        fields: result.fields ? result.fields.map((f: any) => f.name) : [],
        rows: result.rows || [],
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'SQL execution failed' });
    }
  });

  app.post('/api/complaints', async (req, res) => {
    try {
      const newComp = await createComplaintInDb(req.body);
      res.status(201).json(newComp);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create complaint' });
    }
  });

  app.patch('/api/complaints/:id/status', async (req, res) => {
    try {
      const { status, block } = req.body;
      await updateComplaintStatusInDb(req.params.id, status, block);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update status' });
    }
  });

  app.patch('/api/complaints/:id/assign', async (req, res) => {
    try {
      const { officialId, officialName, department, nextStatus, block } = req.body;
      await assignOfficialInDb(req.params.id, officialId, officialName, department, nextStatus, block);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to assign official' });
    }
  });

  app.patch('/api/complaints/:id/resolve', async (req, res) => {
    try {
      const { resolutionNotes, resolvedAt, block } = req.body;
      await resolveComplaintInDb(req.params.id, resolutionNotes, resolvedAt, block);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to resolve complaint' });
    }
  });

  app.patch('/api/complaints/:id/escalate', async (req, res) => {
    try {
      const { escalationReason, block } = req.body;
      await escalateComplaintInDb(req.params.id, escalationReason, block);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to escalate complaint' });
    }
  });

  app.get('/api/notifications', async (_req, res) => {
    try {
      const notifs = await fetchNotifications();
      res.json(notifs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      await createNotificationInDb(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create notification' });
    }
  });

  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      await markNotificationAsReadInDb(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to mark notification as read' });
    }
  });

  app.post('/api/users/sync', async (req, res) => {
    try {
      const { uid, email, name, role, roll } = req.body;
      const user = await getOrCreateUser(uid, email, name, role, roll);
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to sync user' });
    }
  });

  // Mount Vite dev server in middleware mode
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
