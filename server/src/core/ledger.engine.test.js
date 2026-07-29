import crypto from 'crypto';
import { 
  append, 
  verifyChain, 
  verifyRecordExists, 
  buildMerkleRoot, 
  computeRecordHash,
  sortKeys,
  signRecord,
  deriveSectorKey
} from './ledger.engine.js';

// Setup Mock DB
let mockRecords = [];
let mockBlocks = [];

const mockPrismaTx = {
  ledgerRecord: {
    findFirst: async ({ where }) => {
      const filtered = mockRecords.filter(r => r.sector === where.sector);
      return filtered[filtered.length - 1] || null;
    },
    findMany: async ({ where }) => {
      let filtered = mockRecords.filter(r => r.sector === where.sector);
      // Filter out merkleBlockId
      if (where.merkleBlockId === null) {
        filtered = filtered.filter(r => r.merkleBlockId === null);
      } else if (where.sequenceNumber && where.sequenceNumber.gte) {
        filtered = filtered.filter(
          r => r.sequenceNumber >= where.sequenceNumber.gte && 
               r.sequenceNumber <= where.sequenceNumber.lte
        );
      }
      // Sort ascending by sequenceNumber
      return [...filtered].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    },
    create: async ({ data }) => {
      const rec = { ...data, id: data.id || crypto.randomUUID(), merkleBlockId: null };
      mockRecords.push(rec);
      return rec;
    },
    updateMany: async ({ where, data }) => {
      const ids = where.id.in;
      mockRecords.forEach(r => {
        if (ids.includes(r.id)) {
          r.merkleBlockId = data.merkleBlockId;
        }
      });
      return { count: ids.length };
    },
    findUnique: async ({ where }) => {
      return mockRecords.find(r => r.id === where.id) || null;
    },
    count: async () => mockRecords.length
  },
  $executeRawUnsafe: async () => {},
  merkleBlock: {
    create: async ({ data }) => {
      const blk = { ...data, id: crypto.randomUUID() };
      mockBlocks.push(blk);
      return blk;
    },
    findMany: async ({ where }) => {
      const filtered = mockBlocks.filter(b => b.sector === where.sector);
      return filtered.map(b => {
        const recordsInBlock = mockRecords.filter(r => r.merkleBlockId === b.id);
        return { ...b, records: recordsInBlock };
      });
    }
  }
};

const mockPrisma = {
  ...mockPrismaTx,
  $transaction: async (cb) => {
    return await cb(mockPrismaTx);
  }
};

import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';

describe('Ledger Engine Self-Contained Test Suites', () => {
  beforeEach(() => {
    mockRecords = [];
    mockBlocks = [];
  });

  test('append + verifyChain returns valid chain state', async () => {
    const rec1 = await append('VOTE', { candidateId: 5, userId: 12 }, mockPrisma);
    const rec2 = await append('VOTE', { candidateId: 9, userId: 15 }, mockPrisma);

    const check = await verifyChain('VOTE', mockPrisma);
    expect(check.valid).toBe(true);
    expect(check.totalRecords).toBe(2);
  });

  test('Payload tamper detected at HASH_CHAIN or RECORD_HASH layer', async () => {
    await append('TAX', { amount: 12000, filingYear: 2026 }, mockPrisma);
    await append('TAX', { amount: 45000, filingYear: 2026 }, mockPrisma);

    // Tamper with record content
    mockRecords[0].payload = { amount: 1, filingYear: 2026 };

    const check = await verifyChain('TAX', mockPrisma);
    expect(check.valid).toBe(false);
    expect(['RECORD_HASH', 'HASH_CHAIN', 'HMAC_SIGNATURE']).toContain(check.layer);
  });

  test('Merkle block created at exactly 50 records', async () => {
    for (let i = 0; i < 50; i++) {
      await append('VEHICLE', { regNum: `DHAKA-METRO-KA-${1000 + i}`, owner: `User-${i}` }, mockPrisma);
    }

    const unbatchedCount = mockRecords.filter(r => r.sector === 'VEHICLE' && r.merkleBlockId === null).length;
    const batchedCount = mockRecords.filter(r => r.sector === 'VEHICLE' && r.merkleBlockId !== null).length;

    expect(mockBlocks.length).toBe(1);
    expect(unbatchedCount).toBe(0);
    expect(batchedCount).toBe(50);
  });

  test('Merkle root tamper detected at MERKLE_ROOT layer', async () => {
    // Generate block first
    for (let i = 0; i < 50; i++) {
      await append('VEHICLE_TAMPER', { id: i }, mockPrisma);
    }

    const originalRoot = mockBlocks[0].merkleRoot;
    mockBlocks[0].merkleRoot = 'f'.repeat(64);

    const check = await verifyChain('VEHICLE_TAMPER', mockPrisma);
    
    mockBlocks[0].merkleRoot = originalRoot;

    expect(check.valid).toBe(false);
    expect(check.layer).toBe('MERKLE_ROOT');
  });

  test('verifyRecordExists returns no payload fields', async () => {
    const addedObj = await append('CIVIL_REGISTRY', { certId: 'BC-992318', name: 'Zayan Haq' }, mockPrisma);

    const footprint = await verifyRecordExists(addedObj.id, mockPrisma);

    expect(footprint.found).toBe(true);
    expect(footprint.sector).toBe('CIVIL_REGISTRY');
    expect(footprint.payload).toBeUndefined();
  });
});
