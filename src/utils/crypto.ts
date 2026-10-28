import { AuditEntry } from '../types';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Calculates real cryptographic SHA-256 hash for a given string
 * using the browser's native Web Crypto API.
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Normalizes an audit payload to produce a deterministic hash
 */
export function createAuditPayloadString(entry: {
  id?: string;
  entryId?: string;
  complaintId: string;
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  details: string;
  previousHash: string;
}): string {
  const entryId = entry.entryId || entry.id || '';
  return [
    entryId,
    entry.complaintId,
    entry.action,
    entry.actorName,
    entry.actorRole,
    entry.timestamp,
    entry.details.trim(),
    entry.previousHash,
  ].join('|');
}

/**
 * Computes hash for an audit entry linking to previousHash
 */
export async function computeAuditHash(entry: {
  id?: string;
  entryId?: string;
  complaintId: string;
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  details: string;
  previousHash: string;
}): Promise<string> {
  const payload = createAuditPayloadString(entry);
  return await sha256(payload);
}

export interface VerificationResult {
  isValid: boolean;
  totalBlocks: number;
  brokenIndex?: number;
  expectedHash?: string;
  foundHash?: string;
  errorMessage?: string;
}

/**
 * Verifies the integrity of the SHA-256 chained audit trail.
 * Returns isValid=true if all blocks strictly link to previousHash and hashes match content.
 */
export async function verifyAuditChain(trail: AuditEntry[]): Promise<VerificationResult> {
  if (!trail || trail.length === 0) {
    return { isValid: true, totalBlocks: 0 };
  }

  for (let i = 0; i < trail.length; i++) {
    const block = trail[i];

    // Check link to previous block
    if (i === 0) {
      if (block.previousHash !== GENESIS_HASH) {
        return {
          isValid: false,
          totalBlocks: trail.length,
          brokenIndex: 0,
          errorMessage: `Genesis block does not link to GENESIS_HASH. Found: ${block.previousHash}`,
        };
      }
    } else {
      const prevBlock = trail[i - 1];
      if (block.previousHash !== prevBlock.currentHash) {
        return {
          isValid: false,
          totalBlocks: trail.length,
          brokenIndex: i,
          errorMessage: `Chain link broken at Block #${i + 1}. Expected previousHash to be ${prevBlock.currentHash}, but found ${block.previousHash}.`,
        };
      }
    }

    // Recompute current block hash
    const computedHash = await computeAuditHash({
      entryId: block.entryId || (block as any).id,
      id: block.entryId || (block as any).id,
      complaintId: block.complaintId,
      action: block.action,
      actorName: block.actorName,
      actorRole: block.actorRole,
      timestamp: block.timestamp,
      details: block.details,
      previousHash: block.previousHash,
    });

    if (computedHash !== block.currentHash) {
      return {
        isValid: false,
        totalBlocks: trail.length,
        brokenIndex: i,
        expectedHash: computedHash,
        foundHash: block.currentHash,
        errorMessage: `Tampering detected at Block #${i + 1} (${block.action})! Recomputed hash does not match stored hash.`,
      };
    }
  }

  return { isValid: true, totalBlocks: trail.length };
}

/**
 * Helper to display truncated hash e.g. 84fc...b921
 */
export function formatHash(hash: string, start = 6, end = 6): string {
  if (!hash || hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
