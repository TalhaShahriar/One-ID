import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticateJWT, authorizeRoles } from '../core/auth.middleware.js';
import { verifyChain, verifyRecordExists } from '../core/ledger.engine.js';
import { logEvent } from '../core/audit.service.js';

const router = Router();
const ALLOWED_SECTORS = ['VOTE', 'TAX', 'VEHICLE', 'PROPERTY', 'CIVIL_REGISTRY'];

/**
 * GET /api/ledger/verify/:sector — Auth SUPER_ADMIN only
 * Runs verifyChain for a single requested sector
 */
router.get('/verify/:sector', authenticateJWT, authorizeRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { sector } = req.params;

    if (!ALLOWED_SECTORS.includes(sector)) {
      return res.status(400).json({ error: 'Sector unrecognized in platform core specifications.' });
    }

    const auditReport = await verifyChain(sector, prisma);

    await logEvent(
      req.user.userId,
      'LEDGER_SECTOR_AUDIT',
      `Audited blockchain sector "${sector}". Security verified: ${auditReport.valid}`,
      req.ip
    );

    res.json(auditReport);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ledger/verify-all — Auth SUPER_ADMIN only
 * Runs complete blockchain audit across all 5 e-governance sectors
 */
router.get('/verify-all', authenticateJWT, authorizeRoles('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const auditReport = {};
    let overallValid = true;

    for (const sector of ALLOWED_SECTORS) {
      const result = await verifyChain(sector, prisma);
      auditReport[sector] = result;
      if (!result.valid) {
        overallValid = false;
      }
    }

    await logEvent(
      req.user.userId,
      'LEDGER_INTEGRITY_AUDIT_ALL',
      `Ran full 5-module system audit. Overall secure check: ${overallValid}`,
      req.ip
    );

    res.json({
      valid: overallValid,
      sectors: auditReport,
      auditedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ledger/record/:recordId — Public routing
 * Returns validation footprints of a record by ID (No payloads exposed)
 */
router.get('/record/:recordId', async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const footprint = await verifyRecordExists(recordId, prisma);
    
    if (!footprint.found) {
      return res.status(404).json({ found: false, error: 'Record details could not be found.' });
    }

    res.json(footprint);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ledger/stats — Public routing
 * Returns record and block headers state per sector
 */
router.get('/stats', async (req, res, next) => {
  try {
    const statsResult = {};

    for (const sector of ALLOWED_SECTORS) {
      const count = await prisma.ledgerRecord.count({ where: { sector } });
      const lastSealedBlock = await prisma.merkleBlock.findFirst({
        where: { sector },
        orderBy: { sealedAt: 'desc' },
        select: {
          id: true,
          startSequence: true,
          endSequence: true,
          merkleRoot: true,
          sealedAt: true
        }
      });

      statsResult[sector] = {
        recordsCount: count,
        lastBlock: lastSealedBlock || null
      };
    }

    res.json(statsResult);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ledger/records — Auth ADMIN/SUPER_ADMIN only
 * Returns the chain list of audited ledger blocks with full metadata/payloads
 */
router.get('/records', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { sector, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (sector && ALLOWED_SECTORS.includes(sector)) {
      where.sector = sector;
    }

    const records = await prisma.ledgerRecord.findMany({
      where,
      orderBy: { sequenceNumber: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 100),
      skip: parseInt(offset, 10) || 0,
      include: {
        merkleBlock: true
      }
    });

    const totalCount = await prisma.ledgerRecord.count({ where });

    res.json({
      records,
      totalCount,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ledger/public-records
 * Public route to power the unauthenticated /blockchain-visualizer view
 */
router.get('/public-records', async (req, res, next) => {
  try {
    const { sector, limit = 50 } = req.query;

    const where = {};
    if (sector && ALLOWED_SECTORS.includes(sector)) {
      where.sector = sector;
    }

    const records = await prisma.ledgerRecord.findMany({
      where,
      orderBy: { sequenceNumber: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 100),
      include: {
        merkleBlock: true
      }
    });

    res.json({
      records
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ledger/public-verify/:sector
 * Public chain integrity audit for /blockchain-visualizer
 */
router.get('/public-verify/:sector', async (req, res, next) => {
  try {
    const { sector } = req.params;

    if (!ALLOWED_SECTORS.includes(sector)) {
      return res.status(400).json({ error: 'Sector unrecognized in platform core specifications.' });
    }

    const auditReport = await verifyChain(sector, prisma);
    res.json(auditReport);
  } catch (err) {
    next(err);
  }
});

export default router;
