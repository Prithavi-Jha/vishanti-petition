import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Complaint,
  AuditEntry,
  Notification,
  Official,
  UserRole,
  Category,
  Priority,
  Status,
  Attachment,
} from '../types/index.ts';
import { GENESIS_HASH, computeAuditHash } from '../utils/crypto.ts';
import { buildSeedComplaints, INITIAL_OFFICIALS, INITIAL_NOTIFICATIONS } from '../utils/seedData.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';

interface SubmitComplaintParams {
  title: string;
  category: Category;
  priority: Priority;
  description: string;
  isAnonymous: boolean;
  petitionerName?: string;
  petitionerRoll?: string;
  petitionerEmail?: string;
  attachments?: Attachment[];
}

interface GrievanceContextType {
  complaints: Complaint[];
  officials: Official[];
  notifications: Notification[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  submitComplaint: (params: SubmitComplaintParams) => Promise<Complaint>;
  updateStatus: (complaintId: string, newStatus: Status, remarks?: string) => Promise<boolean>;
  assignOfficial: (complaintId: string, officialId: string, remarks?: string) => Promise<boolean>;
  resolveComplaint: (complaintId: string, resolutionNotes: string) => Promise<boolean>;
  escalateComplaint: (complaintId: string, reason: string) => Promise<boolean>;
  runSlaEngine: () => Promise<number>;
  simulateTamper: (complaintId: string, blockIndex: number, fakeDetails: string) => void;
  restoreComplaintChain: (complaintId: string) => Promise<void>;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  getComplaintByTrackingId: (trackingId: string) => Complaint | undefined;
  isLoading: boolean;
}

const GrievanceContext = createContext<GrievanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPLAINTS: 'vishanti_complaints_v1',
  NOTIFICATIONS: 'vishanti_notifications_v1',
  ROLE: 'vishanti_role_v1',
};

export const GrievanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [officials, setOfficials] = useState<Official[]>(INITIAL_OFFICIALS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Directly load all live data from Supabase PostgreSQL tables
  const loadDataFromSupabase = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const [compRes, auditRes, offRes, notifRes] = await Promise.all([
        supabase.from('complaints').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_entries').select('*').order('timestamp', { ascending: true }),
        supabase.from('officials').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      ]);

      if (compRes.error) {
        console.warn('Supabase complaints query error:', compRes.error);
        return false;
      }

      // Group audit logs by complaint_id
      const auditMap: Record<string, AuditEntry[]> = {};
      if (auditRes.data) {
        auditRes.data.forEach((row: any) => {
          if (!auditMap[row.complaint_id]) auditMap[row.complaint_id] = [];
          auditMap[row.complaint_id].push({
            id: row.entry_id,
            entryId: row.entry_id,
            complaintId: row.complaint_id,
            action: row.action,
            actorName: row.actor_name,
            actorRole: row.actor_role,
            timestamp: row.timestamp,
            details: row.details,
            previousHash: row.previous_hash,
            currentHash: row.current_hash,
          });
        });
      }

      if (Array.isArray(compRes.data) && compRes.data.length > 0) {
        const mappedComplaints: Complaint[] = compRes.data.map((c: any) => ({
          id: c.complaint_id,
          complaintId: c.complaint_id,
          trackingId: c.tracking_id,
          title: c.title,
          category: c.category as Category,
          priority: c.priority as Priority,
          status: c.status as Status,
          description: c.description,
          isPublic: c.is_public ?? true,
          isAnonymous: c.is_anonymous ?? false,
          petitionerName: c.petitioner_name || undefined,
          petitionerRoll: c.petitioner_roll || undefined,
          petitionerEmail: c.petitioner_email || undefined,
          assignedOfficialId: c.assigned_official_id || undefined,
          assignedOfficialName: c.assigned_official_name || undefined,
          department: (c.department as Category) || (c.category as Category),
          createdAt: c.created_at,
          deadline: c.deadline,
          resolvedAt: c.resolved_at || undefined,
          resolutionNotes: c.resolution_notes || undefined,
          escalationReason: c.escalation_reason || undefined,
          attachments: [],
          auditTrail: auditMap[c.complaint_id] || [],
        }));

        setComplaints(mappedComplaints);
      }

      if (!offRes.error && Array.isArray(offRes.data) && offRes.data.length > 0) {
        setOfficials(
          offRes.data.map((o: any) => ({
            id: o.official_id,
            officialId: o.official_id,
            name: o.name,
            department: o.department as Category,
            role: o.role,
            email: o.email,
          }))
        );
      }

      if (!notifRes.error && Array.isArray(notifRes.data) && notifRes.data.length > 0) {
        setNotifications(
          notifRes.data.map((n: any) => ({
            id: n.notification_id,
            notificationId: n.notification_id,
            recipientRole: n.recipient_role,
            recipientId: n.recipient_id || undefined,
            title: n.title,
            message: n.message,
            complaintId: n.complaint_id,
            trackingId: n.tracking_id,
            isRead: n.is_read,
            type: n.type,
            createdAt: n.created_at,
          }))
        );
      }

      return true;
    } catch (err) {
      console.warn('Error reading from Supabase database:', err);
      return false;
    }
  }, []);

  // Initialize data directly from Supabase, falling back gracefully
  useEffect(() => {
    async function initData() {
      try {
        let loaded = false;

        // 1. Direct Supabase Query
        if (isSupabaseConfigured) {
          loaded = await loadDataFromSupabase();
        }

        // 2. Secondary API fallback
        if (!loaded) {
          try {
            const [compRes, offRes, notifRes] = await Promise.all([
              fetch('/api/complaints'),
              fetch('/api/officials'),
              fetch('/api/notifications'),
            ]);

            if (compRes.ok && offRes.ok && notifRes.ok) {
              const [compData, offData, notifData] = await Promise.all([
                compRes.json(),
                offRes.json(),
                notifRes.json(),
              ]);

              if (Array.isArray(compData) && compData.length > 0) {
                setComplaints(compData);
                loaded = true;
              }
              if (Array.isArray(offData) && offData.length > 0) {
                setOfficials(offData);
              }
              if (Array.isArray(notifData)) {
                setNotifications(notifData);
              }
            }
          } catch {}
        }

        // 3. Fallback to localStorage or base seed
        if (!loaded) {
          const storedComplaints = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
          const storedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
          const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;

          if (storedRole) {
            setCurrentRole(storedRole);
          }

          if (storedComplaints) {
            setComplaints(JSON.parse(storedComplaints));
          } else {
            const seeds = await buildSeedComplaints();
            setComplaints(seeds);
            localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(seeds));
          }

          if (storedNotifs) {
            setNotifications(JSON.parse(storedNotifs));
          } else {
            setNotifications(INITIAL_NOTIFICATIONS);
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
          }
        }
      } catch (err) {
        console.error('Failed to load grievance data:', err);
        const seeds = await buildSeedComplaints();
        setComplaints(seeds);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, [loadDataFromSupabase]);

  // Real-time synchronization subscription with Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime-db-listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        loadDataFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_entries' }, () => {
        loadDataFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDataFromSupabase]);

  // Sync to localStorage as offline cache
  useEffect(() => {
    if (!isLoading && complaints.length > 0) {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    }
  }, [complaints, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
  }, [notifications, isLoading]);

  const handleSetRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  };

  const calculateDeadline = (priority: Priority): string => {
    const now = Date.now();
    let hours = 96;
    if (priority === 'Urgent') hours = 24;
    else if (priority === 'High') hours = 48;
    else if (priority === 'Medium') hours = 96;
    else if (priority === 'Low') hours = 168;

    return new Date(now + hours * 3600 * 1000).toISOString();
  };

  const getActorInfo = () => {
    if (currentRole === 'authority') {
      return { name: 'Dean of Student Affairs', role: 'Higher Redressal Authority' };
    }
    if (currentRole === 'official') {
      return { name: 'Institutional Grievance Officer', role: 'Official Authority' };
    }
    return { name: 'Student Petitioner', role: 'Student Petitioner' };
  };

  // 1. Submit Complaint (Persisted to PostgreSQL)
  const submitComplaint = async (params: SubmitComplaintParams): Promise<Complaint> => {
    const timestamp = new Date().toISOString();
    const id = `comp-${Date.now()}`;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const categoryPrefix = params.category.charAt(0).toUpperCase();
    const trackingId = `VP-2026-${categoryPrefix}${randomHex}`;
    const deadline = calculateDeadline(params.priority);

    // Initial Genesis Audit Block
    const actor = params.isAnonymous
      ? { name: 'Anonymous Petitioner', role: 'Anonymous Student' }
      : {
          name: params.petitionerName || 'Student Petitioner',
          role: `Student (Roll: ${params.petitionerRoll || 'N/A'})`,
        };

    const genesisPayload = {
      id: `aud-${Date.now()}-1`,
      entryId: `aud-${Date.now()}-1`,
      complaintId: id,
      action: 'TICKET_CREATED',
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details: `Grievance filed with category "${params.category}" and priority "${params.priority}". ${
        params.isAnonymous ? 'Petitioner identity encrypted/concealed.' : 'Petitioner identified.'
      }`,
      previousHash: GENESIS_HASH,
    };

    const currentHash = await computeAuditHash(genesisPayload);
    const genesisBlock: AuditEntry = {
      ...genesisPayload,
      currentHash,
    };

    const newComplaint: Complaint = {
      id,
      complaintId: id,
      trackingId,
      title: params.title.trim(),
      category: params.category,
      priority: params.priority,
      status: 'Submitted',
      description: params.description.trim(),
      isPublic: !params.isAnonymous,
      isAnonymous: params.isAnonymous,
      petitionerName: params.isAnonymous ? undefined : params.petitionerName,
      petitionerRoll: params.isAnonymous ? undefined : params.petitionerRoll,
      petitionerEmail: params.isAnonymous ? undefined : params.petitionerEmail,
      createdAt: timestamp,
      deadline,
      attachments: params.attachments || [],
      auditTrail: [genesisBlock],
    };

    // Optimistic state update
    setComplaints((prev) => [newComplaint, ...prev]);

    // Send to PostgreSQL backend API
    fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComplaint),
    }).catch((err) => console.warn('Could not sync to backend API:', err));

    // Dispatch notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      notificationId: `notif-${Date.now()}`,
      recipientRole: 'official',
      title: '📥 New Grievance Lodged',
      message: `New ticket ${trackingId} lodged under ${params.category} (${params.priority} priority).`,
      complaintId: id,
      trackingId,
      createdAt: timestamp,
      isRead: false,
      type: 'status_change',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif),
    }).catch(() => {});

    // Sync to Supabase
    if (isSupabaseConfigured) {
      supabase
        .from('complaints')
        .insert({
          complaint_id: newComplaint.complaintId || newComplaint.id,
          tracking_id: newComplaint.trackingId,
          title: newComplaint.title,
          category: newComplaint.category,
          priority: newComplaint.priority,
          status: newComplaint.status,
          description: newComplaint.description,
          is_public: newComplaint.isPublic,
          is_anonymous: newComplaint.isAnonymous,
          petitioner_name: newComplaint.petitionerName || null,
          petitioner_roll: newComplaint.petitionerRoll || null,
          petitioner_email: newComplaint.petitionerEmail || null,
          department: newComplaint.department || newComplaint.category,
          deadline: newComplaint.deadline,
          created_at: newComplaint.createdAt,
        })
        .then(() => {});

      supabase
        .from('audit_entries')
        .insert({
          entry_id: genesisBlock.entryId || genesisBlock.id,
          complaint_id: newComplaint.complaintId || newComplaint.id,
          action: genesisBlock.action,
          actor_name: genesisBlock.actorName,
          actor_role: genesisBlock.actorRole,
          timestamp: genesisBlock.timestamp,
          details: genesisBlock.details,
          previous_hash: genesisBlock.previousHash,
          current_hash: genesisBlock.currentHash,
        })
        .then(() => {});
    }

    return newComplaint;
  };

  // 2. Update Status with chained audit block (Persisted to PostgreSQL)
  const updateStatus = async (
    complaintId: string,
    newStatus: Status,
    remarks?: string
  ): Promise<boolean> => {
    const complaint = complaints.find((c) => (c.complaintId || c.id) === complaintId);
    if (!complaint) return false;
    if (complaint.status === newStatus) return false;

    const timestamp = new Date().toISOString();
    const actor = getActorInfo();
    const lastBlock = complaint.auditTrail[complaint.auditTrail.length - 1];
    const previousHash = lastBlock.currentHash;

    const auditPayload = {
      id: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      entryId: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      complaintId,
      action: `STATUS_CHANGED_TO_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details: remarks || `Status changed from "${complaint.status}" to "${newStatus}".`,
      previousHash,
    };

    const currentHash = await computeAuditHash(auditPayload);
    const newBlock: AuditEntry = { ...auditPayload, currentHash };

    setComplaints((prev) =>
      prev.map((c) => {
        if ((c.complaintId || c.id) === complaintId) {
          return {
            ...c,
            status: newStatus,
            auditTrail: [...c.auditTrail, newBlock],
          };
        }
        return c;
      })
    );

    // Persist to PostgreSQL backend
    fetch(`/api/complaints/${encodeURIComponent(complaintId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, block: newBlock }),
    }).catch((err) => console.warn('Could not sync status to backend:', err));

    // Sync to Supabase
    if (isSupabaseConfigured) {
      supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('complaint_id', complaintId)
        .then(() => {});
      supabase
        .from('audit_entries')
        .insert({
          entry_id: newBlock.entryId || newBlock.id,
          complaint_id: complaintId,
          action: newBlock.action,
          actor_name: newBlock.actorName,
          actor_role: newBlock.actorRole,
          timestamp: newBlock.timestamp,
          details: newBlock.details,
          previous_hash: newBlock.previousHash,
          current_hash: newBlock.currentHash,
        })
        .then(() => {});
    }

    // Notification
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      notificationId: `notif-${Date.now()}`,
      recipientRole: 'all',
      title: `Ticket ${complaint.trackingId} Status: ${newStatus}`,
      message: remarks || `Ticket progress updated to ${newStatus}.`,
      complaintId,
      trackingId: complaint.trackingId,
      createdAt: timestamp,
      isRead: false,
      type: 'status_change',
    };
    setNotifications((prev) => [notif, ...prev]);

    return true;
  };

  // 3. Assign Official (Persisted to PostgreSQL)
  const assignOfficial = async (
    complaintId: string,
    officialId: string,
    remarks?: string
  ): Promise<boolean> => {
    const complaint = complaints.find((c) => (c.complaintId || c.id) === complaintId);
    const official = officials.find((o) => (o.officialId || o.id) === officialId);
    if (!complaint || !official) return false;

    const timestamp = new Date().toISOString();
    const actor = getActorInfo();
    const lastBlock = complaint.auditTrail[complaint.auditTrail.length - 1];
    const previousHash = lastBlock.currentHash;

    const auditPayload = {
      id: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      entryId: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      complaintId,
      action: 'OFFICER_ASSIGNED',
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details:
        remarks ||
        `Assigned to ${official.name} (${official.role}, ${official.department} Dept).`,
      previousHash,
    };

    const currentHash = await computeAuditHash(auditPayload);
    const newBlock: AuditEntry = { ...auditPayload, currentHash };

    const nextStatus =
      complaint.status === 'Submitted' || complaint.status === 'Under Review'
        ? 'Assigned'
        : complaint.status;

    setComplaints((prev) =>
      prev.map((c) => {
        if ((c.complaintId || c.id) === complaintId) {
          return {
            ...c,
            assignedOfficialId: official.officialId || official.id || '',
            assignedOfficialName: official.name,
            department: official.department,
            status: nextStatus,
            auditTrail: [...c.auditTrail, newBlock],
          };
        }
        return c;
      })
    );

    // Persist to PostgreSQL backend
    fetch(`/api/complaints/${encodeURIComponent(complaintId)}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        officialId: official.officialId || official.id,
        officialName: official.name,
        department: official.department,
        nextStatus,
        block: newBlock,
      }),
    }).catch((err) => console.warn('Could not sync assignment to backend:', err));

    // Direct Supabase sync
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('complaints')
        .update({
          assigned_official_id: official.officialId || official.id,
          assigned_official_name: official.name,
          department: official.department,
          status: nextStatus,
        })
        .eq('complaint_id', complaintId)
        .then(() => {});

      supabase
        .from('audit_entries')
        .insert({
          entry_id: newBlock.entryId || newBlock.id,
          complaint_id: complaintId,
          action: newBlock.action,
          actor_name: newBlock.actorName,
          actor_role: newBlock.actorRole,
          timestamp: newBlock.timestamp,
          details: newBlock.details,
          previous_hash: newBlock.previousHash,
          current_hash: newBlock.currentHash,
        })
        .then(() => {});
    }

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      notificationId: `notif-${Date.now()}`,
      recipientRole: 'official',
      recipientId: official.officialId || official.id || '',
      title: '🎯 Grievance Assigned To You',
      message: `Ticket ${complaint.trackingId} has been assigned to ${official.name}.`,
      complaintId,
      trackingId: complaint.trackingId,
      createdAt: timestamp,
      isRead: false,
      type: 'assigned',
    };
    setNotifications((prev) => [notif, ...prev]);

    return true;
  };

  // 4. Resolve Complaint (Persisted to PostgreSQL)
  const resolveComplaint = async (
    complaintId: string,
    resolutionNotes: string
  ): Promise<boolean> => {
    const complaint = complaints.find((c) => (c.complaintId || c.id) === complaintId);
    if (!complaint) return false;

    const timestamp = new Date().toISOString();
    const actor = getActorInfo();
    const lastBlock = complaint.auditTrail[complaint.auditTrail.length - 1];
    const previousHash = lastBlock.currentHash;

    const auditPayload = {
      id: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      entryId: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      complaintId,
      action: 'RESOLVED',
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details: `Resolution confirmed: ${resolutionNotes}`,
      previousHash,
    };

    const currentHash = await computeAuditHash(auditPayload);
    const newBlock: AuditEntry = { ...auditPayload, currentHash };

    setComplaints((prev) =>
      prev.map((c) => {
        if ((c.complaintId || c.id) === complaintId) {
          return {
            ...c,
            status: 'Resolved',
            resolvedAt: timestamp,
            resolutionNotes,
            auditTrail: [...c.auditTrail, newBlock],
          };
        }
        return c;
      })
    );

    // Persist to PostgreSQL backend
    fetch(`/api/complaints/${encodeURIComponent(complaintId)}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolutionNotes,
        resolvedAt: timestamp,
        block: newBlock,
      }),
    }).catch((err) => console.warn('Could not sync resolution to backend:', err));

    // Direct Supabase sync
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('complaints')
        .update({
          status: 'Resolved',
          resolved_at: timestamp,
          resolution_notes: resolutionNotes,
        })
        .eq('complaint_id', complaintId)
        .then(() => {});

      supabase
        .from('audit_entries')
        .insert({
          entry_id: newBlock.entryId || newBlock.id,
          complaint_id: complaintId,
          action: newBlock.action,
          actor_name: newBlock.actorName,
          actor_role: newBlock.actorRole,
          timestamp: newBlock.timestamp,
          details: newBlock.details,
          previous_hash: newBlock.previousHash,
          current_hash: newBlock.currentHash,
        })
        .then(() => {});
    }

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      notificationId: `notif-${Date.now()}`,
      recipientRole: 'student',
      title: '🎉 Grievance Marked Resolved',
      message: `Resolution posted for ${complaint.trackingId}: "${resolutionNotes}"`,
      complaintId,
      trackingId: complaint.trackingId,
      createdAt: timestamp,
      isRead: false,
      type: 'resolved',
    };
    setNotifications((prev) => [notif, ...prev]);

    return true;
  };

  // 5. Escalate Complaint (Persisted to PostgreSQL)
  const escalateComplaint = async (
    complaintId: string,
    reason: string
  ): Promise<boolean> => {
    const complaint = complaints.find((c) => (c.complaintId || c.id) === complaintId);
    if (!complaint) return false;

    const timestamp = new Date().toISOString();
    const actor = getActorInfo();
    const lastBlock = complaint.auditTrail[complaint.auditTrail.length - 1];
    const previousHash = lastBlock.currentHash;

    const auditPayload = {
      id: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      entryId: `aud-${Date.now()}-${complaint.auditTrail.length + 1}`,
      complaintId,
      action: 'MANUAL_ESCALATION',
      actorName: actor.name,
      actorRole: actor.role,
      timestamp,
      details: `Escalated to Higher Authority. Reason: ${reason}`,
      previousHash,
    };

    const currentHash = await computeAuditHash(auditPayload);
    const newBlock: AuditEntry = { ...auditPayload, currentHash };

    setComplaints((prev) =>
      prev.map((c) => {
        if ((c.complaintId || c.id) === complaintId) {
          return {
            ...c,
            status: 'Escalated',
            escalationReason: reason,
            auditTrail: [...c.auditTrail, newBlock],
          };
        }
        return c;
      })
    );

    // Persist to PostgreSQL backend
    fetch(`/api/complaints/${encodeURIComponent(complaintId)}/escalate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escalationReason: reason,
        block: newBlock,
      }),
    }).catch((err) => console.warn('Could not sync escalation to backend:', err));

    // Direct Supabase sync
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('complaints')
        .update({
          status: 'Escalated',
          escalation_reason: reason,
        })
        .eq('complaint_id', complaintId)
        .then(() => {});

      supabase
        .from('audit_entries')
        .insert({
          entry_id: newBlock.entryId || newBlock.id,
          complaint_id: complaintId,
          action: newBlock.action,
          actor_name: newBlock.actorName,
          actor_role: newBlock.actorRole,
          timestamp: newBlock.timestamp,
          details: newBlock.details,
          previous_hash: newBlock.previousHash,
          current_hash: newBlock.currentHash,
        })
        .then(() => {});
    }

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      notificationId: `notif-${Date.now()}`,
      recipientRole: 'authority',
      title: '🚨 Grievance Escalated to Higher Authority',
      message: `Ticket ${complaint.trackingId} escalated: ${reason}`,
      complaintId,
      trackingId: complaint.trackingId,
      createdAt: timestamp,
      isRead: false,
      type: 'escalation',
    };
    setNotifications((prev) => [notif, ...prev]);

    return true;
  };

  // 6. SLA Engine (Overdue complaints auto-escalate per Webster Architecture #5)
  const runSlaEngine = async (): Promise<number> => {
    const now = new Date();
    let escalatedCount = 0;
    const updatedComplaints = [...complaints];
    const newNotifs: Notification[] = [];

    for (let i = 0; i < updatedComplaints.length; i++) {
      const c = updatedComplaints[i];
      if (c.status !== 'Resolved' && c.status !== 'Escalated' && c.status !== 'Rejected') {
        const deadlineDate = new Date(c.deadline);
        if (now > deadlineDate) {
          escalatedCount++;
          const timestamp = now.toISOString();
          const lastBlock = c.auditTrail[c.auditTrail.length - 1];
          const previousHash = lastBlock.currentHash;

          const auditPayload = {
            id: `aud-${Date.now()}-${c.auditTrail.length + 1}`,
            entryId: `aud-${Date.now()}-${c.auditTrail.length + 1}`,
            complaintId: c.complaintId || c.id || '',
            action: 'SLA_BREACH_AUTO_ESCALATED',
            actorName: 'Vishanti SLA Watchdog Engine',
            actorRole: 'System Daemon',
            timestamp,
            details: `Target SLA resolution window elapsed (${c.priority} priority). Escalated automatically to Dean of Student Affairs / Redressal Committee.`,
            previousHash,
          };

          const currentHash = await computeAuditHash(auditPayload);
          const newBlock: AuditEntry = { ...auditPayload, currentHash };

          updatedComplaints[i] = {
            ...c,
            status: 'Escalated',
            escalationReason: `Automatic SLA Breach (${c.priority} priority deadline passed on ${deadlineDate.toLocaleDateString()})`,
            auditTrail: [...c.auditTrail, newBlock],
          };

          // Sync to backend
          fetch(`/api/complaints/${encodeURIComponent(c.complaintId || c.id || '')}/escalate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              escalationReason: updatedComplaints[i].escalationReason,
              block: newBlock,
            }),
          }).catch(() => {});

          newNotifs.push({
            id: `notif-${Date.now()}-${i}`,
            notificationId: `notif-${Date.now()}-${i}`,
            recipientRole: 'authority',
            title: `⏰ Auto-Escalated: ${c.trackingId}`,
            message: `SLA breach detected for ${c.title}. Transferred to Higher Authority.`,
            complaintId: c.complaintId || c.id || '',
            trackingId: c.trackingId,
            createdAt: timestamp,
            isRead: false,
            type: 'escalation',
          });
        }
      }
    }

    if (escalatedCount > 0) {
      setComplaints(updatedComplaints);
      setNotifications((prev) => [...newNotifs, ...prev]);
    }

    return escalatedCount;
  };

  // 7. Simulate Tampering on a block (for integrity check validation)
  const simulateTamper = (
    complaintId: string,
    blockIndex: number,
    fakeDetails: string
  ) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if ((c.complaintId || c.id) === complaintId && c.auditTrail[blockIndex]) {
          const newTrail = [...c.auditTrail];
          newTrail[blockIndex] = {
            ...newTrail[blockIndex],
            details: fakeDetails,
            isTampered: true,
          };
          return {
            ...c,
            auditTrail: newTrail,
          };
        }
        return c;
      })
    );
  };

  // 8. Restore genuine chain
  const restoreComplaintChain = async (complaintId: string) => {
    const c = complaints.find((comp) => (comp.complaintId || comp.id) === complaintId);
    if (!c) return;

    const fixedTrail: AuditEntry[] = [];
    for (let i = 0; i < c.auditTrail.length; i++) {
      const block = c.auditTrail[i];
      const prevHash = i === 0 ? GENESIS_HASH : fixedTrail[i - 1].currentHash;

      const payload = {
        id: block.id,
        entryId: block.entryId || block.id,
        complaintId: block.complaintId,
        action: block.action,
        actorName: block.actorName,
        actorRole: block.actorRole,
        timestamp: block.timestamp,
        details: block.details,
        previousHash: prevHash,
      };

      const validHash = await computeAuditHash(payload);
      fixedTrail.push({
        ...payload,
        currentHash: validHash,
        isTampered: false,
      });
    }

    setComplaints((prev) =>
      prev.map((comp) => {
        if ((comp.complaintId || comp.id) === complaintId) {
          return { ...comp, auditTrail: fixedTrail };
        }
        return comp;
      })
    );
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => ((n.notificationId || n.id) === notifId ? { ...n, isRead: true } : n))
    );
    fetch(`/api/notifications/${encodeURIComponent(notifId)}/read`, { method: 'PATCH' }).catch(() => {});
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getComplaintByTrackingId = useCallback(
    (trackingId: string): Complaint | undefined => {
      const cleanId = trackingId.trim().toUpperCase();
      return complaints.find(
        (c) => c.trackingId.toUpperCase() === cleanId || (c.complaintId || c.id) === trackingId
      );
    },
    [complaints]
  );

  return (
    <GrievanceContext.Provider
      value={{
        complaints,
        officials,
        notifications,
        currentRole,
        setCurrentRole: handleSetRole,
        submitComplaint,
        updateStatus,
        assignOfficial,
        resolveComplaint,
        escalateComplaint,
        runSlaEngine,
        simulateTamper,
        restoreComplaintChain,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        getComplaintByTrackingId,
        isLoading,
      }}
    >
      {children}
    </GrievanceContext.Provider>
  );
};

export function useGrievance() {
  const ctx = useContext(GrievanceContext);
  if (!ctx) {
    throw new Error('useGrievance must be used within a GrievanceProvider');
  }
  return ctx;
}
