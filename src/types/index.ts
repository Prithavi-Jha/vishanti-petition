export type Category =
  | 'Academic'
  | 'Hostel & Mess'
  | 'Infrastructure'
  | 'Harassment & Safety'
  | 'Financial & Fees'
  | 'Administration & Library';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Status =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Escalated'
  | 'Rejected';

export type UserRole = 'student' | 'official' | 'authority';

// Reflecting the Class Diagram (PDF Page 5)
export interface User {
  userId: string;
  id?: string;
  name: string;
  email: string;
  roll?: string;
  role: UserRole;
}

export interface Attachment {
  fileId?: string;
  id?: string;
  fileName?: string;
  name?: string;
  fileUrl?: string;
  fileSize?: number;
  size?: number;
  type?: string;
  uploadedAt: string;
}

export interface AuditEntry {
  entryId?: string;
  id?: string;
  complaintId: string;
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  details: string;
  previousHash: string;
  currentHash: string;
  isTampered?: boolean;
}

export interface Official {
  officialId: string;
  id?: string;
  name: string;
  department: Category;
  role: string;
  email: string;
}

export interface Complaint {
  complaintId?: string;
  id?: string; // backwards compatibility alias
  trackingId: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  description: string;
  isPublic?: boolean; // whether public can view or restricted to officials
  isAnonymous?: boolean; // alias for isPublic === false
  userId?: string;
  petitionerName?: string;
  petitionerRoll?: string;
  petitionerEmail?: string;
  assignedOfficialId?: string;
  assignedOfficialName?: string;
  department?: Category;
  createdAt: string;
  deadline: string;
  resolvedAt?: string;
  escalationReason?: string;
  resolutionNotes?: string;
  satisfactionRating?: number;
  attachments: Attachment[];
  auditTrail: AuditEntry[];
}

export interface Notification {
  notificationId?: string;
  id?: string;
  title: string;
  message: string;
  complaintId: string;
  trackingId: string;
  recipientRole: UserRole | 'all';
  recipientId?: string;
  createdAt: string;
  isRead: boolean;
  type?: 'status_change' | 'escalation' | 'assigned' | 'sla_warning' | 'resolved';
}

export interface DuplicateMatch {
  complaint: Complaint;
  similarity: number;
  matchedWords: string[];
}
