import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table (Aligned with Class Diagram: User)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').default('student').notNull(),
  roll: text('roll'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Officials Table (Aligned with Class Diagram: Official)
export const officials = pgTable('officials', {
  id: serial('id').primaryKey(),
  officialId: text('official_id').notNull().unique(),
  name: text('name').notNull(),
  department: text('department').notNull(),
  role: text('role').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Complaints Table (Aligned with Class Diagram: Complaint)
export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  complaintId: text('complaint_id').notNull().unique(),
  trackingId: text('tracking_id').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull(),
  status: text('status').default('Submitted').notNull(),
  description: text('description').notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  petitionerName: text('petitioner_name'),
  petitionerRoll: text('petitioner_roll'),
  petitionerEmail: text('petitioner_email'),
  assignedOfficialId: text('assigned_official_id'),
  assignedOfficialName: text('assigned_official_name'),
  department: text('department'),
  deadline: timestamp('deadline').notNull(),
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'),
  escalationReason: text('escalation_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Audit Entries Table (Aligned with Class Diagram: AuditEntry)
export const auditEntries = pgTable('audit_entries', {
  id: serial('id').primaryKey(),
  entryId: text('entry_id').notNull().unique(),
  complaintId: text('complaint_id').notNull(),
  action: text('action').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  details: text('details').notNull(),
  previousHash: text('previous_hash').notNull(),
  currentHash: text('current_hash').notNull(),
});

// 5. Attachments Table (Aligned with Class Diagram: Attachment)
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  fileId: text('file_id').notNull().unique(),
  complaintId: text('complaint_id').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: text('file_size'),
  fileType: text('file_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Notifications Table (Aligned with Class Diagram: Notification)
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  notificationId: text('notification_id').notNull().unique(),
  recipientRole: text('recipient_role').notNull(),
  recipientId: text('recipient_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  complaintId: text('complaint_id'),
  trackingId: text('tracking_id'),
  isRead: boolean('is_read').default(false).notNull(),
  type: text('type').default('status_change'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schema Relations
export const complaintsRelations = relations(complaints, ({ many }) => ({
  auditTrail: many(auditEntries),
  attachments: many(attachments),
}));

export const auditEntriesRelations = relations(auditEntries, ({ one }) => ({
  complaint: one(complaints, {
    fields: [auditEntries.complaintId],
    references: [complaints.complaintId],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  complaint: one(complaints, {
    fields: [attachments.complaintId],
    references: [complaints.complaintId],
  }),
}));
