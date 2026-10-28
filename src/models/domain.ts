/**
 * The Vishanti Petition - Core Domain Architecture
 * Implementation of Webster 2026 Class Diagram (Team Three Eyes, ID 226)
 *
 * Classes & Methods implemented:
 * 1. User: userId, name, email | submitComplaint(), viewComplaint()
 * 2. Complaint: complaintId, title, category, priority, status | createComplaint(), updateStatus()
 * 3. Official: officialId, name, department | assignComplaint(), resolveComplaint()
 * 4. AuditEntry: entryId, action, timestamp, currentHash, previousHash | recordChange(), verifyHash()
 * 5. Attachment: fileId, fileName, fileUrl | uploadFile()
 * 6. Notification: notificationId, message, createdAt, isRead | sendNotification(), markAsRead()
 */

import { computeAuditHash, verifyAuditChain, GENESIS_HASH } from '../utils/crypto';
import type { Complaint as ComplaintType, AuditEntry as AuditEntryType, Attachment as AttachmentType, Notification as NotificationType, Status, Category, Priority } from '../types';

// ==========================================
// 1. User Class
// ==========================================
export class User {
  public userId: number | string;
  public name: string;
  public email: string;
  public role: string;

  constructor(userId: number | string, name: string, email: string, role = 'student') {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.role = role;
  }

  /**
   * Method: submitComplaint()
   * Submits a new grievance petition into PostgreSQL with category, priority,
   * initial SHA-256 genesis audit block, and returns the created Complaint.
   */
  async submitComplaint(params: {
    title: string;
    category: Category;
    priority: Priority;
    description: string;
    isPublic?: boolean;
    isAnonymous?: boolean;
    petitionerRoll?: string;
    department?: Category;
    attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  }): Promise<Complaint> {
    const trackingId = `VP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
    const compId = `comp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Generate Genesis SHA-256 Audit Block
    const genesisEntryId = `aud-${Date.now()}`;
    const genesisCurrentHash = await computeAuditHash({
      entryId: genesisEntryId,
      complaintId: compId,
      action: 'PETITION_FILED',
      actorName: params.isAnonymous ? 'Anonymous Petitioner' : this.name,
      actorRole: params.isAnonymous ? 'anonymous' : 'petitioner',
      timestamp,
      details: `Petition submitted under ${params.category} category with ${params.priority} priority.`,
      previousHash: GENESIS_HASH,
    });

    const initialAudit: AuditEntryType = {
      id: genesisEntryId,
      entryId: genesisEntryId,
      complaintId: compId,
      action: 'PETITION_FILED',
      actorName: params.isAnonymous ? 'Anonymous Petitioner' : this.name,
      actorRole: (params.isAnonymous ? 'anonymous' : 'petitioner') as any,
      timestamp,
      details: `Petition submitted under ${params.category} category with ${params.priority} priority.`,
      previousHash: GENESIS_HASH,
      currentHash: genesisCurrentHash,
    };

    // Process initial attachments
    const processedAttachments: AttachmentType[] = (params.attachments || []).map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      fileId: `file-${Date.now()}-${i}`,
      name: f.name,
      fileName: f.name,
      fileUrl: f.url,
      size: f.size || 1024,
      fileSize: f.size || 1024,
      type: f.type || 'application/pdf',
      uploadedAt: timestamp,
    }));

    // Calculate SLA deadline based on priority (Urgent: 24h, High: 48h, Medium: 96h, Low: 168h)
    const hours = params.priority === 'Urgent' ? 24 : params.priority === 'High' ? 48 : params.priority === 'Medium' ? 96 : 168;
    const deadline = new Date(Date.now() + hours * 3600 * 1000).toISOString();

    const complaintData: ComplaintType = {
      id: compId,
      complaintId: compId,
      trackingId,
      title: params.title.trim(),
      category: params.category,
      priority: params.priority,
      status: 'Submitted',
      description: params.description.trim(),
      isPublic: params.isPublic ?? true,
      isAnonymous: params.isAnonymous ?? false,
      petitionerName: params.isAnonymous ? undefined : this.name,
      petitionerRoll: params.isAnonymous ? undefined : params.petitionerRoll,
      petitionerEmail: params.isAnonymous ? undefined : this.email,
      department: params.department || params.category,
      deadline,
      createdAt: timestamp,
      auditTrail: [initialAudit],
      attachments: processedAttachments,
    };

    // Save to PostgreSQL via REST API
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintData),
    });

    if (!res.ok) {
      throw new Error(`Failed to submit complaint to database: ${res.statusText}`);
    }

    return new Complaint(
      complaintData.complaintId || compId,
      complaintData.title,
      complaintData.category,
      complaintData.priority,
      complaintData.status,
      complaintData
    );
  }

  /**
   * Method: viewComplaint()
   * Retrieves and inspects a complaint by tracking ID or complaint ID.
   */
  async viewComplaint(complaintIdOrTracking: string): Promise<Complaint | null> {
    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(complaintIdOrTracking)}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP error ${res.status}`);
      }
      const data: ComplaintType = await res.json();
      return new Complaint(
        data.complaintId || data.id || complaintIdOrTracking,
        data.title,
        data.category,
        data.priority,
        data.status,
        data
      );
    } catch (err) {
      console.error('viewComplaint failed:', err);
      return null;
    }
  }
}

// ==========================================
// 2. Complaint Class
// ==========================================
export class Complaint {
  public complaintId: number | string;
  public title: string;
  public category: string;
  public priority: string;
  public status: string;
  public rawData?: ComplaintType;

  constructor(
    complaintId: number | string,
    title: string,
    category: string,
    priority: string,
    status: string,
    rawData?: ComplaintType
  ) {
    this.complaintId = complaintId;
    this.title = title;
    this.category = category;
    this.priority = priority;
    this.status = status;
    this.rawData = rawData;
  }

  /**
   * Method: createComplaint()
   * Static factory method to instantiate and store a complaint in PostgreSQL.
   */
  static async createComplaint(user: User, data: {
    title: string;
    category: Category;
    priority: Priority;
    description: string;
    isPublic?: boolean;
    isAnonymous?: boolean;
  }): Promise<Complaint> {
    return await user.submitComplaint(data);
  }

  /**
   * Method: updateStatus()
   * Transitions complaint status, computes a new SHA-256 chained hash block,
   * appends to audit history, and synchronizes with PostgreSQL.
   */
  async updateStatus(
    newStatus: Status,
    actor: { name: string; role: string; details?: string }
  ): Promise<boolean> {
    const compId = String(this.complaintId);
    const timestamp = new Date().toISOString();
    const entryId = `aud-${Date.now()}`;

    // Get the previous hash from existing trail if available
    const lastBlock = this.rawData?.auditTrail?.[this.rawData.auditTrail.length - 1];
    const previousHash = lastBlock ? lastBlock.currentHash : GENESIS_HASH;

    const details = actor.details || `Status transitioned from ${this.status} to ${newStatus}`;
    const currentHash = await computeAuditHash({
      entryId,
      complaintId: compId,
      action: 'STATUS_CHANGED',
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details,
      previousHash,
    });

    const block: AuditEntryType = {
      id: entryId,
      entryId,
      complaintId: compId,
      action: 'STATUS_CHANGED',
      actorName: actor.name,
      actorRole: actor.role as any,
      timestamp,
      details,
      previousHash,
      currentHash,
    };

    const res = await fetch(`/api/complaints/${encodeURIComponent(compId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, block }),
    });

    if (res.ok) {
      this.status = newStatus;
      if (this.rawData) {
        this.rawData.status = newStatus;
        this.rawData.auditTrail.push(block);
      }
      return true;
    }
    return false;
  }
}

// ==========================================
// 3. Official Class
// ==========================================
export class Official {
  public officialId: number | string;
  public name: string;
  public department: string;
  public role: string;

  constructor(officialId: number | string, name: string, department: string, role = 'Official') {
    this.officialId = officialId;
    this.name = name;
    this.department = department;
    this.role = role;
  }

  /**
   * Method: assignComplaint()
   * Assigns complaint to a responsible official/department, updates status to 'In Progress',
   * and creates a cryptographically signed audit block.
   */
  async assignComplaint(
    complaintId: string,
    targetOfficial: { officialId: string; name: string; department: string },
    actor: { name: string; role: string; previousHash?: string }
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const entryId = `aud-${Date.now()}`;
    const prevHash = actor.previousHash || GENESIS_HASH;
    const details = `Assigned to ${targetOfficial.name} (${targetOfficial.department}). Action taken by ${actor.name}.`;

    const currentHash = await computeAuditHash({
      entryId,
      complaintId,
      action: 'OFFICIAL_ASSIGNED',
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details,
      previousHash: prevHash,
    });

    const block: AuditEntryType = {
      id: entryId,
      entryId,
      complaintId,
      action: 'OFFICIAL_ASSIGNED',
      actorName: actor.name,
      actorRole: actor.role as any,
      timestamp,
      details,
      previousHash: prevHash,
      currentHash,
    };

    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        officialId: targetOfficial.officialId,
        officialName: targetOfficial.name,
        department: targetOfficial.department,
        nextStatus: 'In Progress',
        block,
      }),
    });

    return res.ok;
  }

  /**
   * Method: resolveComplaint()
   * Marks grievance as resolved with official remarks, recording a verifiable audit block.
   */
  async resolveComplaint(
    complaintId: string,
    resolutionNotes: string,
    actor: { name: string; role: string; previousHash?: string }
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const entryId = `aud-${Date.now()}`;
    const prevHash = actor.previousHash || GENESIS_HASH;
    const details = `Petition resolved by ${actor.name}. Remarks: ${resolutionNotes}`;

    const currentHash = await computeAuditHash({
      entryId,
      complaintId,
      action: 'PETITION_RESOLVED',
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details,
      previousHash: prevHash,
    });

    const block: AuditEntryType = {
      id: entryId,
      entryId,
      complaintId,
      action: 'PETITION_RESOLVED',
      actorName: actor.name,
      actorRole: actor.role as any,
      timestamp,
      details,
      previousHash: prevHash,
      currentHash,
    };

    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolutionNotes,
        resolvedAt: timestamp,
        block,
      }),
    });

    return res.ok;
  }
}

// ==========================================
// 4. AuditEntry Class
// ==========================================
export class AuditEntry {
  public entryId: number | string;
  public action: string;
  public timestamp: string | Date;
  public currentHash: string;
  public previousHash: string;

  constructor(
    entryId: number | string,
    action: string,
    timestamp: string | Date,
    currentHash: string,
    previousHash: string
  ) {
    this.entryId = entryId;
    this.action = action;
    this.timestamp = timestamp;
    this.currentHash = currentHash;
    this.previousHash = previousHash;
  }

  /**
   * Method: recordChange()
   * Computes SHA-256 hash chaining and constructs a new AuditEntry record.
   */
  static async recordChange(params: {
    complaintId: string;
    action: string;
    actorName: string;
    actorRole: string;
    details: string;
    previousHash: string;
  }): Promise<AuditEntry> {
    const entryId = `aud-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const currentHash = await computeAuditHash({
      entryId,
      complaintId: params.complaintId,
      action: params.action,
      actorName: params.actorName,
      actorRole: params.actorRole,
      timestamp,
      details: params.details,
      previousHash: params.previousHash,
    });

    return new AuditEntry(entryId, params.action, timestamp, currentHash, params.previousHash);
  }

  /**
   * Method: verifyHash()
   * Verifies the cryptographic mathematical integrity of the SHA-256 chain.
   * Detects any tampering or unauthorized alterations.
   */
  static async verifyHash(trail: AuditEntryType[]): Promise<{
    isValid: boolean;
    totalBlocks: number;
    details: string;
  }> {
    const result = await verifyAuditChain(trail);
    if (result.isValid) {
      return {
        isValid: true,
        totalBlocks: result.totalBlocks,
        details: `Cryptographic audit verified. All ${result.totalBlocks} sequential block hashes valid & linked.`,
      };
    } else {
      return {
        isValid: false,
        totalBlocks: result.totalBlocks,
        details: result.errorMessage || 'Tamper detected in cryptographic chain.',
      };
    }
  }
}

// ==========================================
// 5. Attachment Class
// ==========================================
export class Attachment {
  public fileId: number | string;
  public fileName: string;
  public fileUrl: string;
  public fileSize?: string;

  constructor(fileId: number | string, fileName: string, fileUrl: string, fileSize?: string) {
    this.fileId = fileId;
    this.fileName = fileName;
    this.fileUrl = fileUrl;
    this.fileSize = fileSize;
  }

  /**
   * Method: uploadFile()
   * Attaches supporting document or image evidence to a complaint in PostgreSQL.
   */
  static async uploadFile(
    complaintId: string,
    file: { fileName: string; fileUrl: string; fileSize?: string; fileType?: string }
  ): Promise<Attachment> {
    const fileId = `file-${Date.now()}`;
    const payload = {
      fileId,
      complaintId,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize || '1.0 MB',
      fileType: file.fileType || 'application/pdf',
    };

    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to upload attachment: ${res.statusText}`);
    }

    return new Attachment(fileId, file.fileName, file.fileUrl, file.fileSize);
  }
}

// ==========================================
// 6. Notification Class
// ==========================================
export class Notification {
  public notificationId: number | string;
  public message: string;
  public createdAt: string | Date;
  public isRead: boolean;

  constructor(
    notificationId: number | string,
    message: string,
    createdAt: string | Date,
    isRead = false
  ) {
    this.notificationId = notificationId;
    this.message = message;
    this.createdAt = createdAt;
    this.isRead = isRead;
  }

  /**
   * Method: sendNotification()
   * Triggers and sends a notification to target roles/students/officials in PostgreSQL.
   */
  static async sendNotification(params: {
    recipientRole: string;
    recipientId?: string;
    title: string;
    message: string;
    complaintId?: string;
    trackingId?: string;
    type?: string;
  }): Promise<Notification> {
    const notificationId = `notif-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const payload = {
      id: notificationId,
      notificationId,
      recipientRole: params.recipientRole,
      recipientId: params.recipientId,
      title: params.title,
      message: params.message,
      complaintId: params.complaintId,
      trackingId: params.trackingId,
      isRead: false,
      type: params.type || 'status_change',
      createdAt,
    };

    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to send notification: ${res.statusText}`);
    }

    return new Notification(notificationId, params.message, createdAt, false);
  }

  /**
   * Method: markAsRead()
   * Updates notification read status to true in PostgreSQL.
   */
  async markAsRead(): Promise<boolean> {
    const notifId = String(this.notificationId);
    const res = await fetch(`/api/notifications/${encodeURIComponent(notifId)}/read`, {
      method: 'PATCH',
    });

    if (res.ok) {
      this.isRead = true;
      return true;
    }
    return false;
  }
}
