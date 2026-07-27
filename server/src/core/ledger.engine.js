import crypto from 'crypto';
import { prisma } from '../prisma.js';

const GENESIS_HASH = '0'.repeat(64);
const BATCH_SIZE = 50;

/**
 * Recursively sorts keys of an object to ensure deterministic JSON representation
 * @param {*} obj - Any input value
 * @returns {*} Sorted object or same value
 */
export function sortKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  const keys = Object.keys(obj).sort();
  const sorted = {};
  for (const key of keys) {
    sorted[key] = sortKeys(obj[key]);
  }
  return sorted;
}

/**
 * Derives a deterministic HMAC-SHA256 sector key using a system secret salt
 * @param {string} sector - Ledger sector code
 * @returns {string} HMAC SHA-256 hex string corresponding to sector key
 */
export function deriveSectorKey(sector) {
  const secret = process.env.LEDGER_HMAC_SECRET || 'bangladesh-e-gov-super-hmac-secret-key-salt-9876';
  return crypto.createHmac('sha256', sector).update(secret).digest('hex');
}

/**
 * Computes a record's deterministic cryptographic hash
 * @param {object} record - Object with id, sector, payload, timestamp, prevHash
 * @returns {string} SHA-256 hash
 */
export function computeRecordHash(record) {
  const sortedPayload = sortKeys(record.payload);
  const tsStr = record.timestamp instanceof Date ? record.timestamp.toISOString() : new Date(record.timestamp).toISOString();
  const data = [
    record.id || '',
    record.sector,
    JSON.stringify(sortedPayload),
    tsStr,
    record.prevHash || GENESIS_HASH
  ].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Signs a record with HMAC-SHA256 of its hash using the sector derived key
 * @param {object} record - Record containing sector
 * @param {string} recordHash - Precomputed record hash
 * @returns {string} HMAC signature
 */
export function signRecord(record, recordHash) {
  const key = deriveSectorKey(record.sector);
  return crypto.createHmac('sha256', key).update(recordHash).digest('hex');
}

/**
 * Computes the root of a Merkle Tree bottom-up pairwise
 * @param {string[]} hashes - List of node hashes
 * @returns {string} Merkle Root
 */
export function buildMerkleRoot(hashes) {
  if (!hashes || hashes.length === 0) {
    return GENESIS_HASH;
  }
  let currentLayer = [...hashes];
  
  while (currentLayer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        const paired = currentLayer[i] + currentLayer[i + 1];
        nextLayer.push(crypto.createHash('sha256').update(paired).digest('hex'));
      } else {
        // Handle odd count by duplicating the lone leaf node
        const paired = currentLayer[i] + currentLayer[i];
        nextLayer.push(crypto.createHash('sha256').update(paired).digest('hex'));
      }
    }
    currentLayer = nextLayer;
  }
  return currentLayer[0];
}

// Alias for backwards compatibility
export const computeMerkleRoot = buildMerkleRoot;

/**
 * Seals 50 records into a Merkle Block
 * @param {string} sector - The sector
 * @param {number} lastSeqNo - The last sequence number of the batch
 * @param {object} tx - Prisma transaction context
 * @returns {Promise<object>} Created MerkleBlock
 */
export async function sealMerkleBlock(sector, lastSeqNo, tx = prisma) {
  const records = await tx.ledgerRecord.findMany({
    where: {
      sector,
      sequenceNumber: {
        gte: lastSeqNo - 49,
        lte: lastSeqNo
      }
    },
    orderBy: { sequenceNumber: 'asc' }
  });

  if (records.length !== BATCH_SIZE) {
    throw new Error(`Cannot seal Merkle block for ${sector}: expected ${BATCH_SIZE} records, found ${records.length}`);
  }

  const hashes = records.map(r => r.recordHash);
  const merkleRoot = buildMerkleRoot(hashes);

  const block = await tx.merkleBlock.create({
    data: {
      sector,
      startSequence: lastSeqNo - 49,
      endSequence: lastSeqNo,
      merkleRoot
    }
  });

  await tx.ledgerRecord.updateMany({
    where: {
      id: { in: records.map(r => r.id) }
    },
    data: {
      merkleBlockId: block.id
    }
  });

  console.log(`📡 [Merkle Core] Block Sealed: Sector ${sector} | Start ${lastSeqNo - 49} - End ${lastSeqNo} | Root: ${merkleRoot}`);
  return block;
}

/**
 * Appends a record securely to the ledger sector
 * @param {string} sector - LedgerSector enum
 * @param {object} payload - Deterministic JSON
 * @param {object} dbClient - Optional Prisma Client override or transaction context
 * @returns {Promise<object>} Created Record
 */
export async function append(sector, payload, dbClient = prisma) {
  const client = dbClient || prisma;
  return await client.$transaction(async (tx) => {
    const lastRecord = await tx.ledgerRecord.findFirst({
      where: { sector },
      orderBy: { sequenceNumber: 'desc' }
    });

    const lastSeqNo = lastRecord ? lastRecord.sequenceNumber : 0;
    const currentSeqNo = lastSeqNo + 1;
    const prevHash = lastRecord ? lastRecord.recordHash : GENESIS_HASH;

    const id = crypto.randomUUID();
    const timestamp = new Date();

    const recordInput = {
      id,
      sector,
      payload,
      timestamp,
      prevHash
    };

    const recordHash = computeRecordHash(recordInput);
    const signature = signRecord(recordInput, recordHash);

    const newRecord = await tx.ledgerRecord.create({
      data: {
        id,
        sector,
        sequenceNumber: currentSeqNo,
        payload,
        timestamp,
        prevHash,
        recordHash,
        signature
      }
    });

    if (currentSeqNo % BATCH_SIZE === 0) {
      await sealMerkleBlock(sector, currentSeqNo, tx);
    }

    return newRecord;
  });
}

// Alias for backward compatibility
export const appendLedgerRecord = append;

/**
 * Verification of sequential chaining, HMAC signature, and Merkle records
 * @param {string} sector - The target sector
 * @param {object} dbClient - Prisma instance override
 * @returns {Promise<object>} Chain authenticity report
 */
export async function verifyChain(sector, dbClient = prisma) {
  const client = dbClient || prisma;
  try {
    const records = await client.ledgerRecord.findMany({
      where: { sector },
      orderBy: { sequenceNumber: 'asc' }
    });

    const totalRecords = records.length;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];

      if (rec.sequenceNumber !== i + 1) {
        return {
          valid: false,
          layer: 'SEQUENCE_CHAIN',
          brokenAt: rec.sequenceNumber,
          reason: `Discontinuity in sequence allocation. Index expected ${i + 1}, found ${rec.sequenceNumber}`
        };
      }

      const expectedPrevHash = i === 0 ? GENESIS_HASH : records[i - 1].recordHash;
      if (rec.prevHash !== expectedPrevHash) {
        return {
          valid: false,
          layer: 'HASH_CHAIN',
          brokenAt: rec.sequenceNumber,
          reason: `Discontinuity in cryptographic forward-hash chaining. PrevHash does not match previous block hash.`
        };
      }

      const recomputedHash = computeRecordHash(rec);
      if (rec.recordHash !== recomputedHash) {
        return {
          valid: false,
          layer: 'RECORD_HASH',
          brokenAt: rec.sequenceNumber,
          reason: `Cryptographic payload tampered. Record hash mismatch.`
        };
      }

      const expectedSignature = signRecord(rec, rec.recordHash);
      if (rec.signature !== expectedSignature) {
        return {
          valid: false,
          layer: 'HMAC_SIGNATURE',
          brokenAt: rec.sequenceNumber,
          reason: `HMAC Signature compromised. Sector authentication validation failed.`
        };
      }
    }

    // Verify all Merkle Blocks
    const blocks = await client.merkleBlock.findMany({
      where: { sector },
      include: {
        records: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });

    for (const block of blocks) {
      if (block.records.length === 0) {
        return {
          valid: false,
          layer: 'MERKLE_ROOT',
          brokenAt: block.startSequence,
          reason: `Empty Merkle block detected.`
        };
      }

      const hashes = block.records.map(r => r.recordHash);
      const computedRoot = buildMerkleRoot(hashes);

      if (block.merkleRoot !== computedRoot) {
        return {
          valid: false,
          layer: 'MERKLE_ROOT',
          brokenAt: block.endSequence,
          reason: `Merkle Root mismatch. Root value compromised.`
        };
      }
    }

    return {
      valid: true,
      totalRecords,
      sector
    };

  } catch (error) {
    return {
      valid: false,
      layer: 'SYSTEM',
      brokenAt: null,
      reason: `Verification exception occurred: ${error.message}`
    };
  }
}

// Alias for backward compatibility
export async function verifySectorLedger(sector, dbClient = prisma) {
  const result = await verifyChain(sector, dbClient);
  if (result.valid) {
    return {
      valid: true,
      count: result.totalRecords,
      blocksCount: Math.floor(result.totalRecords / BATCH_SIZE),
      message: `Sector ${sector} successfully verified.`
    };
  } else {
    return {
      valid: false,
      error: result.reason,
      troubledRecord: { sequenceNumber: result.brokenAt }
    };
  }
}

/**
 * Validates existence of a specific record in e-governance ledger by ID
 * @param {string} recordId - Target uuid
 * @param {object} dbClient - Prisma instance context
 * @returns {Promise<object>} Reduced verification footprint payload
 */
export async function verifyRecordExists(recordId, dbClient = prisma) {
  const client = dbClient || prisma;
  const record = await client.ledgerRecord.findUnique({
    where: { id: recordId }
  });

  if (!record) {
    return { found: false };
  }

  return {
    found: true,
    sector: record.sector,
    timestamp: record.timestamp,
    sequenceNumber: record.sequenceNumber,
    merkleSealed: record.merkleBlockId !== null
  };
}

/**
 * Seals open records manually into a Merkle block (backward compatibility fallback)
 */
export async function sealOpenSectorRecords(sector, dbClient = prisma) {
  const client = dbClient || prisma;
  return await client.$transaction(async (tx) => {
    const unbatched = await tx.ledgerRecord.findMany({
      where: { sector, merkleBlockId: null },
      orderBy: { sequenceNumber: 'asc' }
    });

    if (unbatched.length === 0) {
      return null;
    }

    const hashes = unbatched.map(r => r.recordHash);
    const merkleRoot = buildMerkleRoot(hashes);
    const startSeq = unbatched[0].sequenceNumber;
    const endSeq = unbatched[unbatched.length - 1].sequenceNumber;

    const block = await tx.merkleBlock.create({
      data: {
        sector,
        startSequence: startSeq,
        endSequence: endSeq,
        merkleRoot
      }
    });

    await tx.ledgerRecord.updateMany({
      where: { id: { in: unbatched.map(r => r.id) } },
      data: { merkleBlockId: block.id }
    });

    return block;
  });
}

// Legacy Votechain-centric stub exports
export function computeVoteHash(voteId, candidateId, electionId, timestamp, prevHash) {
  const data = [voteId, candidateId, electionId, timestamp, prevHash].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function verifyAuditChain() {
  return { success: true, message: 'Legacy audit chain successfully emulated.' };
}

export async function writeBlockToLedger(voteId, payload) {
  return { success: true, blockId: voteId };
}
