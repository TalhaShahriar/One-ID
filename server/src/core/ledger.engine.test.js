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

async function runTests() {
  console.log('🧪 Starting Shared LedgerEngine Self-Contained Test Suites...\n');

  // Test 1: append + verifyChain returns valid
  try {
    mockRecords = [];
    mockBlocks = [];

    const rec1 = await append('VOTE', { candidateId: 5, userId: 12 }, mockPrisma);
    const rec2 = await append('VOTE', { candidateId: 9, userId: 15 }, mockPrisma);

    const check = await verifyChain('VOTE', mockPrisma);
    if (check.valid && check.totalRecords === 2) {
      console.log('✅ TEST 1 PASSED: append + verifyChain successfully returns valid chain state.');
    } else {
      console.log('❌ TEST 1 FAILED:', check);
    }
  } catch (err) {
    console.error('❌ TEST 1 EXCEPTION:', err);
  }

  // Test 2: Payload tamper detected at HASH_CHAIN or RECORD_HASH layer
  try {
    mockRecords = [];
    mockBlocks = [];

    await append('TAX', { amount: 12000, filingYear: 2026 }, mockPrisma);
    await append('TAX', { amount: 45000, filingYear: 2026 }, mockPrisma);

    // Tamper with record content
    mockRecords[0].payload = { amount: 1, filingYear: 2026 };

    const check = await verifyChain('TAX', mockPrisma);
    if (!check.valid && (check.layer === 'RECORD_HASH' || check.layer === 'HASH_CHAIN' || check.layer === 'HMAC_SIGNATURE')) {
      console.log(`✅ TEST 2 PASSED: Tampering successfully caught at "${check.layer}" layer.`);
    } else {
      console.log('❌ TEST 2 FAILED: Tamper went undetected or registered wrong layer:', check);
    }
  } catch (err) {
    console.error('❌ TEST 2 EXCEPTION:', err);
  }

  // Test 3: Merkle block created at exactly 50 records
  try {
    mockRecords = [];
    mockBlocks = [];

    console.log('⏳ Simulating 50 record additions for sector VEHICLE...');
    for (let i = 0; i < 50; i++) {
      await append('VEHICLE', { regNum: `DHAKA-METRO-KA-${1000 + i}`, owner: `User-${i}` }, mockPrisma);
    }

    const unbatchedCount = mockRecords.filter(r => r.sector === 'VEHICLE' && r.merkleBlockId === null).length;
    const batchedCount = mockRecords.filter(r => r.sector === 'VEHICLE' && r.merkleBlockId !== null).length;

    if (mockBlocks.length === 1 && unbatchedCount === 0 && batchedCount === 50) {
      console.log('✅ TEST 3 PASSED: Merkle block successfully sealed at exactly 50 records.');
    } else {
      console.log(`❌ TEST 3 FAILED: Blocks Count: ${mockBlocks.length}, Unbatched: ${unbatchedCount}, Batched: ${batchedCount}`);
    }
  } catch (err) {
    console.error('❌ TEST 3 EXCEPTION:', err);
  }

  // Test 4: Merkle root tamper detected at MERKLE_ROOT layer
  try {
    if (mockBlocks.length > 0) {
      // Modify block merkleRoot directly to simulate database tampering
      const originalRoot = mockBlocks[0].merkleRoot;
      mockBlocks[0].merkleRoot = 'f'.repeat(64);

      const check = await verifyChain('VEHICLE', mockPrisma);
      
      // Restore root 
      mockBlocks[0].merkleRoot = originalRoot;

      if (!check.valid && check.layer === 'MERKLE_ROOT') {
        console.log('✅ TEST 4 PASSED: Merkle root tampering detected at MERKLE_ROOT layer correctly.');
      } else {
        console.log('❌ TEST 4 FAILED: Merkle root tamper went undetected or layer incorrect:', check);
      }
    } else {
      console.log('❌ TEST 4 BLOCKED: No Merkle blocks generated in previous test.');
    }
  } catch (err) {
    console.error('❌ TEST 4 EXCEPTION:', err);
  }

  // Test 5: verifyRecordExists returns no payload fields
  try {
    mockRecords = [];
    mockBlocks = [];
    const addedObj = await append('CIVIL_REGISTRY', { certId: 'BC-992318', name: 'Zayan Haq' }, mockPrisma);

    const footprint = await verifyRecordExists(addedObj.id, mockPrisma);

    if (footprint.found && footprint.sector === 'CIVIL_REGISTRY' && footprint.payload === undefined) {
      console.log('✅ TEST 5 PASSED: verifyRecordExists returns correct meta headers without exposing raw payload fields.');
    } else {
      console.log('❌ TEST 5 FAILED: Footprint returned invalid structure or leaked payload data:', footprint);
    }
  } catch (err) {
    console.error('❌ TEST 5 EXCEPTION:', err);
  }

  console.log('\n🏁 Ledger test suites completed.');
}

runTests();
