import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { logEvent } from '../utils/audit.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/anomaly/stats - Admin only
 * Returns the aggregates: total, byType, high_severity count, and active counts today.
 */
router.get('/stats', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const total = await prisma.anomalyFlag.count();
    const high_severity = await prisma.anomalyFlag.count({
      where: { severity: 'HIGH' }
    });
    const today = await prisma.anomalyFlag.count({
      where: {
        created_at: {
          gte: todayStart
        }
      }
    });

    const ipSpikeCount = await prisma.anomalyFlag.count({ where: { flag_type: 'IP_RATE_SPIKE' } });
    const devCollisionCount = await prisma.anomalyFlag.count({ where: { flag_type: 'DEVICE_COLLISION' } });
    const offHoursCount = await prisma.anomalyFlag.count({ where: { flag_type: 'OFF_HOURS_ACTIVITY' } });

    return res.json({
      total,
      high_severity,
      today,
      byType: {
        IP_RATE_SPIKE: ipSpikeCount,
        DEVICE_COLLISION: devCollisionCount,
        OFF_HOURS_ACTIVITY: offHoursCount
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/anomaly - Admin only
 * Paginated list of all flags, optional filters: type, severity, electionId.
 */
router.get('/', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { type, severity, electionId } = req.query;

    const where = {};
    if (type) {
      where.flag_type = type;
    }
    if (severity) {
      where.severity = severity;
    }
    if (electionId) {
      const parsedElectionId = parseInt(electionId, 10);
      if (!isNaN(parsedElectionId)) {
        where.election_id = parsedElectionId;
      }
    }

    const total = await prisma.anomalyFlag.count({ where });
    const anomalies = await prisma.anomalyFlag.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.json({
      anomalies,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/anomaly/recent - Admin only
 * Returns the last 10 AnomalyFlag records ordered by created_at desc
 */
router.get('/recent', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const anomalies = await prisma.anomalyFlag.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return res.json(anomalies);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/anomaly/:id/review - Admin only
 * Marks an anomaly flag as reviewed
 */
router.patch('/:id/review', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const anomalyId = parseInt(req.params.id, 10);
    if (isNaN(anomalyId)) {
      return res.status(400).json({ error: 'Anomaly ID must be a numeric integer.' });
    }

    const updated = await prisma.anomalyFlag.update({
      where: { id: anomalyId },
      data: { is_reviewed: true }
    });

    await logEvent(
      req.user.userId,
      'ANOMALY_REVIEW',
      `Anomaly flag ID ${anomalyId} marked as reviewed by admin.`,
      req.ip
    );

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
