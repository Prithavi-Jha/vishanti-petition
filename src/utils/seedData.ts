import { Complaint, Official, Notification, Category } from '../types';
import { GENESIS_HASH, computeAuditHash } from './crypto';

export const INITIAL_OFFICIALS: (Official & { id: string })[] = [
  {
    officialId: 'off-1',
    id: 'off-1',
    name: 'Prof. A. K. Sharma',
    department: 'Academic',
    role: 'Dean of Academic Affairs',
    email: 'dean.academic@vishanti.edu',
  },
  {
    officialId: 'off-2',
    id: 'off-2',
    name: 'Dr. Sunita Rao',
    department: 'Hostel & Mess',
    role: 'Chief Warden & Housing Director',
    email: 'warden.housing@vishanti.edu',
  },
  {
    officialId: 'off-3',
    id: 'off-3',
    name: 'Er. Rajesh Gupta',
    department: 'Infrastructure',
    role: 'Chief Campus Estate Officer',
    email: 'estate.works@vishanti.edu',
  },
  {
    officialId: 'off-4',
    id: 'off-4',
    name: 'Prof. Nalini Deshmukh',
    department: 'Harassment & Safety',
    role: 'Chairperson, Internal Complaints Committee',
    email: 'icc.chair@vishanti.edu',
  },
  {
    officialId: 'off-5',
    id: 'off-5',
    name: 'Mr. Arvind Subramaniam',
    department: 'Financial & Fees',
    role: 'Bursar & Accounts Head',
    email: 'accounts@vishanti.edu',
  },
];

export async function buildSeedComplaints(): Promise<Complaint[]> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;

  // Complaint 1: Hostel water supply (Resolved)
  const c1Id = 'comp-101';
  const c1Created = new Date(now - 4 * day).toISOString();
  const c1Review = new Date(now - 3.8 * day).toISOString();
  const c1Assigned = new Date(now - 3.5 * day).toISOString();
  const c1Resolved = new Date(now - 1.2 * day).toISOString();
  const c1Deadline = new Date(now - 2 * day).toISOString();

  const c1Block0Payload = {
    id: 'aud-101-1',
    complaintId: c1Id,
    action: 'TICKET_CREATED',
    actorName: 'Aditya Verma',
    actorRole: 'Student (Named)',
    timestamp: c1Created,
    details: 'Initial grievance submitted with category Hostel & Mess, priority Urgent.',
    previousHash: GENESIS_HASH,
  };
  const c1Hash0 = await computeAuditHash(c1Block0Payload);

  const c1Block1Payload = {
    id: 'aud-101-2',
    complaintId: c1Id,
    action: 'UNDER_REVIEW',
    actorName: 'Central Grievance Desk',
    actorRole: 'Automated Triaging',
    timestamp: c1Review,
    details: 'Complaint triaged and verified for hostel block C-Wing.',
    previousHash: c1Hash0,
  };
  const c1Hash1 = await computeAuditHash(c1Block1Payload);

  const c1Block2Payload = {
    id: 'aud-101-3',
    complaintId: c1Id,
    action: 'OFFICER_ASSIGNED',
    actorName: 'Dr. Sunita Rao',
    actorRole: 'Chief Warden & Housing Director',
    timestamp: c1Assigned,
    details: 'Assigned to Dr. Sunita Rao for urgent plumbing contractor inspection.',
    previousHash: c1Hash1,
  };
  const c1Hash2 = await computeAuditHash(c1Block2Payload);

  const c1Block3Payload = {
    id: 'aud-101-4',
    complaintId: c1Id,
    action: 'RESOLVED',
    actorName: 'Dr. Sunita Rao',
    actorRole: 'Chief Warden & Housing Director',
    timestamp: c1Resolved,
    details: 'Submersible water pump line in Block-C replaced. Water pressure restored and water quality tested.',
    previousHash: c1Hash2,
  };
  const c1Hash3 = await computeAuditHash(c1Block3Payload);

  const comp1: Complaint = {
    id: c1Id,
    trackingId: 'VP-2026-H8912',
    title: 'Disrupted Water Supply in Boys Hostel Block C - 3rd & 4th Floors',
    category: 'Hostel & Mess',
    priority: 'Urgent',
    status: 'Resolved',
    description:
      'The overhead water tank booster pump for Block C failed two days ago. Over 180 residents across 3rd and 4th floors have zero running water in restrooms since yesterday morning.',
    isAnonymous: false,
    petitionerName: 'Aditya Verma',
    petitionerRoll: '20241029',
    petitionerEmail: 'aditya.verma@vishanti.edu',
    assignedOfficialId: 'off-2',
    assignedOfficialName: 'Dr. Sunita Rao',
    department: 'Hostel & Mess',
    createdAt: c1Created,
    deadline: c1Deadline,
    resolvedAt: c1Resolved,
    resolutionNotes:
      'Contractor team dispatched on priority. Auxiliary line activated at 14:00. New industrial motor installed and pressure gauge reading 4.2 bar normal.',
    satisfactionRating: 5,
    attachments: [
      {
        id: 'att-1',
        name: 'block_c_dry_taps.jpg',
        size: 1420000,
        type: 'image/jpeg',
        uploadedAt: c1Created,
      },
      {
        id: 'att-2',
        name: 'warden_inspection_report.pdf',
        size: 384000,
        type: 'application/pdf',
        uploadedAt: c1Resolved,
      },
    ],
    auditTrail: [
      { ...c1Block0Payload, currentHash: c1Hash0 },
      { ...c1Block1Payload, currentHash: c1Hash1 },
      { ...c1Block2Payload, currentHash: c1Hash2 },
      { ...c1Block3Payload, currentHash: c1Hash3 },
    ],
  };

  // Complaint 2: Anonymous - Overdue & Escalated (Library Wi-Fi & Electrical Outlets)
  const c2Id = 'comp-102';
  const c2Created = new Date(now - 6 * day).toISOString();
  const c2Assigned = new Date(now - 5.5 * day).toISOString();
  const c2Deadline = new Date(now - 2 * day).toISOString();
  const c2Escalated = new Date(now - 1.5 * day).toISOString();

  const c2Block0Payload = {
    id: 'aud-102-1',
    complaintId: c2Id,
    action: 'TICKET_CREATED',
    actorName: 'Anonymous Petitioner',
    actorRole: 'Anonymous Student',
    timestamp: c2Created,
    details: 'Initial grievance submitted anonymously with category Infrastructure, priority High.',
    previousHash: GENESIS_HASH,
  };
  const c2Hash0 = await computeAuditHash(c2Block0Payload);

  const c2Block1Payload = {
    id: 'aud-102-2',
    complaintId: c2Id,
    action: 'OFFICER_ASSIGNED',
    actorName: 'Helpdesk Triager',
    actorRole: 'Official',
    timestamp: c2Assigned,
    details: 'Assigned to Er. Rajesh Gupta (Campus Estate & Electrical Lead).',
    previousHash: c2Hash0,
  };
  const c2Hash1 = await computeAuditHash(c2Block1Payload);

  const c2Block2Payload = {
    id: 'aud-102-3',
    complaintId: c2Id,
    action: 'SLA_BREACH_AUTO_ESCALATED',
    actorName: 'Vishanti SLA Engine',
    actorRole: 'System Daemon',
    timestamp: c2Escalated,
    details: 'Target SLA deadline (48 hours) elapsed without resolution. Escalated to Higher Authority (Dean Office).',
    previousHash: c2Hash1,
  };
  const c2Hash2 = await computeAuditHash(c2Block2Payload);

  const comp2: Complaint = {
    id: c2Id,
    trackingId: 'VP-2026-I4029',
    title: 'Repeated Wi-Fi Dropouts and Non-Functional Power Sockets in Central Library 2nd Floor',
    category: 'Infrastructure',
    priority: 'High',
    status: 'Escalated',
    description:
      'Wi-Fi Access Point AP-LIB-04 has been malfunctioning for over a week during mid-semester exam preparations. Additionally, rows 4 to 8 electrical sockets are ungrounded and tripping constantly.',
    isAnonymous: true,
    department: 'Infrastructure',
    assignedOfficialId: 'off-3',
    assignedOfficialName: 'Er. Rajesh Gupta',
    createdAt: c2Created,
    deadline: c2Deadline,
    escalationReason: 'SLA breached by 36+ hours. Critical study area during active examination season.',
    attachments: [
      {
        id: 'att-3',
        name: 'speedtest_packetloss_log.txt',
        size: 45000,
        type: 'text/plain',
        uploadedAt: c2Created,
      },
    ],
    auditTrail: [
      { ...c2Block0Payload, currentHash: c2Hash0 },
      { ...c2Block1Payload, currentHash: c2Hash1 },
      { ...c2Block2Payload, currentHash: c2Hash2 },
    ],
  };

  // Complaint 3: Academic Schedule Conflict (In Progress)
  const c3Id = 'comp-103';
  const c3Created = new Date(now - 1.5 * day).toISOString();
  const c3Assigned = new Date(now - 1.1 * day).toISOString();
  const c3Deadline = new Date(now + 2.5 * day).toISOString();

  const c3Block0Payload = {
    id: 'aud-103-1',
    complaintId: c3Id,
    action: 'TICKET_CREATED',
    actorName: 'Kavya Sen',
    actorRole: 'Student (Named)',
    timestamp: c3Created,
    details: 'Initial grievance submitted with category Academic, priority High.',
    previousHash: GENESIS_HASH,
  };
  const c3Hash0 = await computeAuditHash(c3Block0Payload);

  const c3Block1Payload = {
    id: 'aud-103-2',
    complaintId: c3Id,
    action: 'OFFICER_ASSIGNED',
    actorName: 'Prof. A. K. Sharma',
    actorRole: 'Dean of Academic Affairs',
    timestamp: c3Assigned,
    details: 'Assigned to Dean of Academic Affairs for timetable committee reconciliation.',
    previousHash: c3Hash0,
  };
  const c3Hash1 = await computeAuditHash(c3Block1Payload);

  const comp3: Complaint = {
    id: c3Id,
    trackingId: 'VP-2026-A1177',
    title: 'Direct Timetable Clash Between CS304 (Distributed Systems) and EC208 Elective Mid-Term',
    category: 'Academic',
    priority: 'High',
    status: 'In Progress',
    description:
      'The published end-term examination schedule lists both CS304 and EC208 on November 4th from 10:00 AM to 1:00 PM. Over 45 dual-degree and minor students are registered for both courses.',
    isAnonymous: false,
    petitionerName: 'Kavya Sen',
    petitionerRoll: '20230841',
    petitionerEmail: 'kavya.sen@vishanti.edu',
    assignedOfficialId: 'off-1',
    assignedOfficialName: 'Prof. A. K. Sharma',
    department: 'Academic',
    createdAt: c3Created,
    deadline: c3Deadline,
    attachments: [
      {
        id: 'att-4',
        name: 'exam_timetable_overlap.pdf',
        size: 512000,
        type: 'application/pdf',
        uploadedAt: c3Created,
      },
    ],
    auditTrail: [
      { ...c3Block0Payload, currentHash: c3Hash0 },
      { ...c3Block1Payload, currentHash: c3Hash1 },
    ],
  };

  // Complaint 4: Mess Hygiene & Cold Food (Under Review)
  const c4Id = 'comp-104';
  const c4Created = new Date(now - 12 * hour).toISOString();
  const c4UnderReview = new Date(now - 6 * hour).toISOString();
  const c4Deadline = new Date(now + 3 * day).toISOString();

  const c4Block0Payload = {
    id: 'aud-104-1',
    complaintId: c4Id,
    action: 'TICKET_CREATED',
    actorName: 'Anonymous Petitioner',
    actorRole: 'Anonymous Student',
    timestamp: c4Created,
    details: 'Initial grievance submitted anonymously with category Hostel & Mess, priority Medium.',
    previousHash: GENESIS_HASH,
  };
  const c4Hash0 = await computeAuditHash(c4Block0Payload);

  const c4Block1Payload = {
    id: 'aud-104-2',
    complaintId: c4Id,
    action: 'UNDER_REVIEW',
    actorName: 'Food Safety Audit Committee',
    actorRole: 'Official',
    timestamp: c4UnderReview,
    details: 'Ticket queued for surprise kitchen audit and student mess council feedback review.',
    previousHash: c4Hash0,
  };
  const c4Hash1 = await computeAuditHash(c4Block1Payload);

  const comp4: Complaint = {
    id: c4Id,
    trackingId: 'VP-2026-M5532',
    title: 'Irregular Dinner Timings and Substandard Food Temperature in Dining Hall 2',
    category: 'Hostel & Mess',
    priority: 'Medium',
    status: 'Under Review',
    description:
      'Dinner service is consistently closing 25 minutes prior to announced 9:30 PM slot. Food served between 8:45-9:00 PM is lukewarm and chapati dough appears undercooked.',
    isAnonymous: true,
    department: 'Hostel & Mess',
    createdAt: c4Created,
    deadline: c4Deadline,
    attachments: [],
    auditTrail: [
      { ...c4Block0Payload, currentHash: c4Hash0 },
      { ...c4Block1Payload, currentHash: c4Hash1 },
    ],
  };

  // Complaint 5: Fee Receipt generation delay (Resolved)
  const c5Id = 'comp-105';
  const c5Created = new Date(now - 8 * day).toISOString();
  const c5Resolved = new Date(now - 5 * day).toISOString();
  const c5Deadline = new Date(now - 4 * day).toISOString();

  const c5Block0Payload = {
    id: 'aud-105-1',
    complaintId: c5Id,
    action: 'TICKET_CREATED',
    actorName: 'Rohan Mehra',
    actorRole: 'Student (Named)',
    timestamp: c5Created,
    details: 'Initial grievance submitted with category Financial & Fees, priority Medium.',
    previousHash: GENESIS_HASH,
  };
  const c5Hash0 = await computeAuditHash(c5Block0Payload);

  const c5Block1Payload = {
    id: 'aud-105-2',
    complaintId: c5Id,
    action: 'RESOLVED',
    actorName: 'Mr. Arvind Subramaniam',
    actorRole: 'Bursar & Accounts Head',
    timestamp: c5Resolved,
    details: 'Bank payment reconciliation batch script synced; receipt #RCP-8829 generated on ERP portal.',
    previousHash: c5Hash0,
  };
  const c5Hash1 = await computeAuditHash(c5Block1Payload);

  const comp5: Complaint = {
    id: c5Id,
    trackingId: 'VP-2026-F9004',
    title: 'Tuition Fee Payment Deducted but Official Tax Receipt Not Generated for Scholarship',
    category: 'Financial & Fees',
    priority: 'Medium',
    status: 'Resolved',
    description:
      'Bank transaction of INR 74,500 went through via NEFT on 12th Oct, but the university ERP still shows Fee Pending and the state scholarship portal deadline is closing.',
    isAnonymous: false,
    petitionerName: 'Rohan Mehra',
    petitionerRoll: '20242208',
    petitionerEmail: 'rohan.mehra@vishanti.edu',
    assignedOfficialId: 'off-5',
    assignedOfficialName: 'Mr. Arvind Subramaniam',
    department: 'Financial & Fees',
    createdAt: c5Created,
    deadline: c5Deadline,
    resolvedAt: c5Resolved,
    resolutionNotes: 'ERP ledger updated manually and official stamped receipt emailed to student.',
    satisfactionRating: 4,
    attachments: [
      {
        id: 'att-5',
        name: 'bank_neft_utr_statement.pdf',
        size: 215000,
        type: 'application/pdf',
        uploadedAt: c5Created,
      },
    ],
    auditTrail: [
      { ...c5Block0Payload, currentHash: c5Hash0 },
      { ...c5Block1Payload, currentHash: c5Hash1 },
    ],
  };

  return [comp1, comp2, comp3, comp4, comp5];
}

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    notificationId: 'notif-1',
    id: 'notif-1',
    recipientRole: 'authority',
    title: '⚠️ Critical SLA Breach Escalation',
    message: 'Ticket VP-2026-I4029 (Library Wi-Fi & Sockets) has exceeded SLA deadline and was escalated to Dean.',
    complaintId: 'comp-102',
    trackingId: 'VP-2026-I4029',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    type: 'escalation',
  },
  {
    notificationId: 'notif-2',
    id: 'notif-2',
    recipientRole: 'official',
    title: '📌 New Grievance Assigned',
    message: 'You have been assigned to Ticket VP-2026-A1177 (Academic Timetable Clash).',
    complaintId: 'comp-103',
    trackingId: 'VP-2026-A1177',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    type: 'assigned',
  },
  {
    notificationId: 'notif-3',
    id: 'notif-3',
    recipientRole: 'student',
    title: '✅ Grievance Resolved',
    message: 'Ticket VP-2026-H8912 (Boys Hostel Water Supply) has been marked Resolved. Tap water restored.',
    complaintId: 'comp-101',
    trackingId: 'VP-2026-H8912',
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    type: 'resolved',
  },
];
