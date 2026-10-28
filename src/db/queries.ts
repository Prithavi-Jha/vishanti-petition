import { db } from './index.ts';
import {
  complaints as complaintsTable,
  auditEntries as auditEntriesTable,
  attachments as attachmentsTable,
  officials as officialsTable,
  notifications as notificationsTable,
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { Complaint, AuditEntry, Attachment, Official, Notification, Status, Category, UserRole } from '../types/index.ts';
import { INITIAL_OFFICIALS, INITIAL_NOTIFICATIONS, buildSeedComplaints } from '../utils/seedData.ts';

export async function seedDatabaseIfEmpty() {
  try {
    const existingOfficials = await db.select().from(officialsTable).limit(1);
    if (existingOfficials.length === 0) {
      console.log('Seeding PostgreSQL database with initial officials...');
      for (const off of INITIAL_OFFICIALS) {
        await db.insert(officialsTable).values({
          officialId: off.officialId || (off as any).id || `off-${Date.now()}`,
          name: off.name,
          department: off.department,
          role: off.role,
          email: off.email,
        }).onConflictDoNothing();
      }
    }

    const existingComplaints = await db.select().from(complaintsTable).limit(1);
    if (existingComplaints.length === 0) {
      console.log('Seeding PostgreSQL database with initial complaints and audit history...');
      const seeds = await buildSeedComplaints();
      for (const c of seeds) {
        const compId = c.complaintId || c.id || `comp-${Date.now()}`;
        await db.insert(complaintsTable).values({
          complaintId: compId,
          trackingId: c.trackingId,
          title: c.title,
          category: c.category,
          priority: c.priority,
          status: c.status,
          description: c.description,
          isPublic: c.isPublic ?? true,
          isAnonymous: c.isAnonymous ?? false,
          petitionerName: c.petitionerName || null,
          petitionerRoll: c.petitionerRoll || null,
          petitionerEmail: c.petitionerEmail || null,
          assignedOfficialId: c.assignedOfficialId || null,
          assignedOfficialName: c.assignedOfficialName || null,
          department: c.department || null,
          deadline: new Date(c.deadline),
          resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : null,
          resolutionNotes: c.resolutionNotes || null,
          escalationReason: c.escalationReason || null,
          createdAt: new Date(c.createdAt),
        }).onConflictDoNothing();

        // Audit Trail
        for (const block of c.auditTrail) {
          await db.insert(auditEntriesTable).values({
            entryId: block.entryId || block.id || `aud-${Date.now()}`,
            complaintId: compId,
            action: block.action,
            actorName: block.actorName,
            actorRole: block.actorRole,
            timestamp: new Date(block.timestamp),
            details: block.details,
            previousHash: block.previousHash,
            currentHash: block.currentHash,
          }).onConflictDoNothing();
        }

        // Attachments
        if (c.attachments && c.attachments.length > 0) {
          for (const att of c.attachments) {
            await db.insert(attachmentsTable).values({
              fileId: att.fileId || att.id || `file-${Date.now()}`,
              complaintId: compId,
              fileName: att.fileName || att.name || 'document.pdf',
              fileUrl: att.fileUrl || '#',
              fileSize: typeof att.fileSize === 'number' ? `${att.fileSize} B` : (att.size ? `${att.size} B` : '1.0 MB'),
              fileType: att.type || 'application/pdf',
              createdAt: new Date(),
            }).onConflictDoNothing();
          }
        }
      }

      // Notifications
      for (const notif of INITIAL_NOTIFICATIONS) {
        await db.insert(notificationsTable).values({
          notificationId: notif.notificationId || notif.id || `notif-${Date.now()}`,
          recipientRole: notif.recipientRole,
          recipientId: notif.recipientId || null,
          title: notif.title,
          message: notif.message,
          complaintId: notif.complaintId || null,
          trackingId: notif.trackingId || null,
          isRead: notif.isRead,
          type: notif.type || 'status_change',
          createdAt: new Date(notif.createdAt),
        }).onConflictDoNothing();
      }
      console.log('PostgreSQL database seeded successfully.');
    }
  } catch (err) {
    console.error('Database seeding error:', err);
  }
}

export async function fetchOfficials(): Promise<Official[]> {
  try {
    const rows = await db.select().from(officialsTable);
    return rows.map((r) => ({
      officialId: r.officialId,
      id: r.officialId,
      name: r.name,
      department: r.department as Category,
      role: r.role,
      email: r.email,
    }));
  } catch (error) {
    console.error('Failed to fetch officials from PostgreSQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function fetchComplaints(): Promise<Complaint[]> {
  try {
    const rawComplaints = await db.select().from(complaintsTable).orderBy(desc(complaintsTable.createdAt));
    const allAudit = await db.select().from(auditEntriesTable).orderBy(auditEntriesTable.timestamp);
    const allAttachments = await db.select().from(attachmentsTable);

    const auditMap: Record<string, AuditEntry[]> = {};
    for (const a of allAudit) {
      if (!auditMap[a.complaintId]) auditMap[a.complaintId] = [];
      auditMap[a.complaintId].push({
        id: a.entryId,
        entryId: a.entryId,
        complaintId: a.complaintId,
        action: a.action,
        actorName: a.actorName,
        actorRole: a.actorRole,
        timestamp: a.timestamp.toISOString(),
        details: a.details,
        previousHash: a.previousHash,
        currentHash: a.currentHash,
      });
    }

    const attachMap: Record<string, Attachment[]> = {};
    for (const att of allAttachments) {
      if (!attachMap[att.complaintId]) attachMap[att.complaintId] = [];
      attachMap[att.complaintId].push({
        id: att.fileId,
        fileId: att.fileId,
        name: att.fileName,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        size: 1024,
        fileSize: 1024,
        type: att.fileType || 'application/pdf',
        uploadedAt: att.createdAt.toISOString(),
      });
    }

    return rawComplaints.map((c) => ({
      id: c.complaintId,
      complaintId: c.complaintId,
      trackingId: c.trackingId,
      title: c.title,
      category: c.category as Category,
      priority: c.priority as any,
      status: c.status as Status,
      description: c.description,
      isPublic: c.isPublic,
      isAnonymous: c.isAnonymous,
      petitionerName: c.petitionerName || undefined,
      petitionerRoll: c.petitionerRoll || undefined,
      petitionerEmail: c.petitionerEmail || undefined,
      assignedOfficialId: c.assignedOfficialId || undefined,
      assignedOfficialName: c.assignedOfficialName || undefined,
      department: (c.department as Category) || undefined,
      deadline: c.deadline.toISOString(),
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : undefined,
      resolutionNotes: c.resolutionNotes || undefined,
      escalationReason: c.escalationReason || undefined,
      createdAt: c.createdAt.toISOString(),
      auditTrail: auditMap[c.complaintId] || [],
      attachments: attachMap[c.complaintId] || [],
    }));
  } catch (error) {
    console.error('Failed to fetch complaints from PostgreSQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function createComplaintInDb(complaint: Complaint) {
  try {
    const compId = complaint.complaintId || complaint.id || `comp-${Date.now()}`;
    await db.insert(complaintsTable).values({
      complaintId: compId,
      trackingId: complaint.trackingId,
      title: complaint.title,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      description: complaint.description,
      isPublic: complaint.isPublic ?? true,
      isAnonymous: complaint.isAnonymous ?? false,
      petitionerName: complaint.petitionerName || null,
      petitionerRoll: complaint.petitionerRoll || null,
      petitionerEmail: complaint.petitionerEmail || null,
      assignedOfficialId: complaint.assignedOfficialId || null,
      assignedOfficialName: complaint.assignedOfficialName || null,
      department: complaint.department || null,
      deadline: new Date(complaint.deadline),
      createdAt: new Date(complaint.createdAt),
    });

    for (const block of complaint.auditTrail) {
      await db.insert(auditEntriesTable).values({
        entryId: block.entryId || block.id || `aud-${Date.now()}`,
        complaintId: compId,
        action: block.action,
        actorName: block.actorName,
        actorRole: block.actorRole,
        timestamp: new Date(block.timestamp),
        details: block.details,
        previousHash: block.previousHash,
        currentHash: block.currentHash,
      });
    }

    if (complaint.attachments) {
      for (const att of complaint.attachments) {
        await db.insert(attachmentsTable).values({
          fileId: att.fileId || att.id || `file-${Date.now()}`,
          complaintId: compId,
          fileName: att.fileName || att.name || 'document.pdf',
          fileUrl: att.fileUrl || '#',
          fileSize: typeof att.fileSize === 'number' ? `${att.fileSize} B` : '1.0 MB',
          fileType: att.type || 'application/pdf',
          createdAt: new Date(),
        });
      }
    }

    return complaint;
  } catch (error) {
    console.error('Failed to insert complaint into PostgreSQL:', error);
    throw new Error('Database insertion failed', { cause: error });
  }
}

export async function appendAuditBlock(complaintId: string, block: AuditEntry) {
  try {
    await db.insert(auditEntriesTable).values({
      entryId: block.entryId || block.id || `aud-${Date.now()}`,
      complaintId,
      action: block.action,
      actorName: block.actorName,
      actorRole: block.actorRole,
      timestamp: new Date(block.timestamp),
      details: block.details,
      previousHash: block.previousHash,
      currentHash: block.currentHash,
    });
  } catch (error) {
    console.error('Failed to append audit block in PostgreSQL:', error);
    throw new Error('Database audit update failed', { cause: error });
  }
}

export async function updateComplaintStatusInDb(
  complaintId: string,
  newStatus: Status,
  block: AuditEntry
) {
  try {
    await db
      .update(complaintsTable)
      .set({ status: newStatus })
      .where(eq(complaintsTable.complaintId, complaintId));

    await appendAuditBlock(complaintId, block);
  } catch (error) {
    console.error('Failed to update complaint status in PostgreSQL:', error);
    throw new Error('Database update failed', { cause: error });
  }
}

export async function assignOfficialInDb(
  complaintId: string,
  officialId: string,
  officialName: string,
  department: string,
  nextStatus: Status,
  block: AuditEntry
) {
  try {
    await db
      .update(complaintsTable)
      .set({
        assignedOfficialId: officialId,
        assignedOfficialName: officialName,
        department,
        status: nextStatus,
      })
      .where(eq(complaintsTable.complaintId, complaintId));

    await appendAuditBlock(complaintId, block);
  } catch (error) {
    console.error('Failed to assign official in PostgreSQL:', error);
    throw new Error('Database assignment update failed', { cause: error });
  }
}

export async function resolveComplaintInDb(
  complaintId: string,
  resolutionNotes: string,
  resolvedAt: string,
  block: AuditEntry
) {
  try {
    await db
      .update(complaintsTable)
      .set({
        status: 'Resolved',
        resolvedAt: new Date(resolvedAt),
        resolutionNotes,
      })
      .where(eq(complaintsTable.complaintId, complaintId));

    await appendAuditBlock(complaintId, block);
  } catch (error) {
    console.error('Failed to resolve complaint in PostgreSQL:', error);
    throw new Error('Database resolution update failed', { cause: error });
  }
}

export async function escalateComplaintInDb(
  complaintId: string,
  escalationReason: string,
  block: AuditEntry
) {
  try {
    await db
      .update(complaintsTable)
      .set({
        status: 'Escalated',
        escalationReason,
      })
      .where(eq(complaintsTable.complaintId, complaintId));

    await appendAuditBlock(complaintId, block);
  } catch (error) {
    console.error('Failed to escalate complaint in PostgreSQL:', error);
    throw new Error('Database escalation update failed', { cause: error });
  }
}

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const raw = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));
    return raw.map((n) => ({
      id: n.notificationId,
      notificationId: n.notificationId,
      recipientRole: n.recipientRole as UserRole | 'all',
      recipientId: n.recipientId || undefined,
      title: n.title,
      message: n.message,
      complaintId: n.complaintId || '',
      trackingId: n.trackingId || '',
      isRead: n.isRead,
      type: (n.type as any) || 'status_change',
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch notifications from PostgreSQL:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function createNotificationInDb(notif: Notification) {
  try {
    await db.insert(notificationsTable).values({
      notificationId: notif.notificationId || notif.id || `notif-${Date.now()}`,
      recipientRole: notif.recipientRole,
      recipientId: notif.recipientId || null,
      title: notif.title,
      message: notif.message,
      complaintId: notif.complaintId || null,
      trackingId: notif.trackingId || null,
      isRead: notif.isRead,
      type: notif.type || 'status_change',
      createdAt: new Date(notif.createdAt),
    });
  } catch (error) {
    console.error('Failed to insert notification in PostgreSQL:', error);
    throw new Error('Database insertion failed', { cause: error });
  }
}

export async function markNotificationAsReadInDb(notificationId: string) {
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.notificationId, notificationId));
  } catch (error) {
    console.error('Failed to mark notification as read in PostgreSQL:', error);
    throw new Error('Database update failed', { cause: error });
  }
}

export async function fetchComplaintById(idOrTracking: string): Promise<Complaint | null> {
  try {
    const rawComplaints = await db
      .select()
      .from(complaintsTable)
      .where(eq(complaintsTable.complaintId, idOrTracking))
      .limit(1);

    let match = rawComplaints[0];
    if (!match) {
      const byTracking = await db
        .select()
        .from(complaintsTable)
        .where(eq(complaintsTable.trackingId, idOrTracking))
        .limit(1);
      match = byTracking[0];
    }

    if (!match) return null;

    const audit = await db
      .select()
      .from(auditEntriesTable)
      .where(eq(auditEntriesTable.complaintId, match.complaintId))
      .orderBy(auditEntriesTable.timestamp);

    const attachments = await db
      .select()
      .from(attachmentsTable)
      .where(eq(attachmentsTable.complaintId, match.complaintId));

    return {
      id: match.complaintId,
      complaintId: match.complaintId,
      trackingId: match.trackingId,
      title: match.title,
      category: match.category as Category,
      priority: match.priority as any,
      status: match.status as Status,
      description: match.description,
      isPublic: match.isPublic,
      isAnonymous: match.isAnonymous,
      petitionerName: match.petitionerName || undefined,
      petitionerRoll: match.petitionerRoll || undefined,
      petitionerEmail: match.petitionerEmail || undefined,
      assignedOfficialId: match.assignedOfficialId || undefined,
      assignedOfficialName: match.assignedOfficialName || undefined,
      department: (match.department as Category) || undefined,
      deadline: match.deadline.toISOString(),
      resolvedAt: match.resolvedAt ? match.resolvedAt.toISOString() : undefined,
      resolutionNotes: match.resolutionNotes || undefined,
      escalationReason: match.escalationReason || undefined,
      createdAt: match.createdAt.toISOString(),
      auditTrail: audit.map((a) => ({
        id: a.entryId,
        entryId: a.entryId,
        complaintId: a.complaintId,
        action: a.action,
        actorName: a.actorName,
        actorRole: a.actorRole,
        timestamp: a.timestamp.toISOString(),
        details: a.details,
        previousHash: a.previousHash,
        currentHash: a.currentHash,
      })),
      attachments: attachments.map((att) => ({
        id: att.fileId,
        fileId: att.fileId,
        name: att.fileName,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        size: 1024,
        fileSize: 1024,
        type: att.fileType || 'application/pdf',
        uploadedAt: att.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Failed to fetch complaint by id from PostgreSQL:', error);
    throw new Error('Database lookup failed', { cause: error });
  }
}

export async function addAttachmentInDb(complaintId: string, att: any) {
  try {
    const fileId = att.fileId || att.id || `file-${Date.now()}`;
    await db.insert(attachmentsTable).values({
      fileId,
      complaintId,
      fileName: att.fileName || att.name || 'document.pdf',
      fileUrl: att.fileUrl || '#',
      fileSize: typeof att.fileSize === 'number' ? `${att.fileSize} B` : (att.size ? `${att.size} B` : '1.0 MB'),
      fileType: att.fileType || att.type || 'application/pdf',
      createdAt: new Date(),
    });
    return { fileId, complaintId, ...att };
  } catch (error) {
    console.error('Failed to add attachment in PostgreSQL:', error);
    throw new Error('Database attachment failed', { cause: error });
  }
}

export async function fetchDatabaseStats() {
  try {
    const complaintsCount = await db.select().from(complaintsTable);
    const officialsCount = await db.select().from(officialsTable);
    const auditCount = await db.select().from(auditEntriesTable);
    const attachCount = await db.select().from(attachmentsTable);
    const notifCount = await db.select().from(notificationsTable);

    return {
      complaints: complaintsCount.length,
      officials: officialsCount.length,
      auditEntries: auditCount.length,
      attachments: attachCount.length,
      notifications: notifCount.length,
      database: 'PostgreSQL 15',
      region: 'ap-southeast-1',
      instanceId: 'vishanti-db-prod-226',
    };
  } catch (error) {
    console.error('Failed to fetch stats from PostgreSQL:', error);
    throw new Error('Database stats failed', { cause: error });
  }
}

