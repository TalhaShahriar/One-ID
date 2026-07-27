import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { verifyChain } from '../utils/blockchain.js';
import { logEvent } from '../utils/audit.js';
import { lastVerificationResults } from '../cron/auditVerifier.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * 1. GET /api/audit/logs - Admin only
 * Retreives a filtered and paginated list of immutable security logs.
 */
router.get('/logs', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const { event_type, user_id, election_id, date_from, date_to } = req.query;

    const filter = {};
    if (event_type) {
      filter.event_type = event_type;
    }
    if (user_id) {
      const parsedUserId = parseInt(user_id, 10);
      if (!isNaN(parsedUserId)) filter.user_id = parsedUserId;
    }
    if (election_id) {
      const parsedElectionId = parseInt(election_id, 10);
      if (!isNaN(parsedElectionId)) filter.election_id = parsedElectionId;
    }

    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) {
        filter.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        filter.created_at.lte = new Date(date_to);
      }
    }

    const total = await prisma.auditLog.count({ where: filter });
    const logs = await prisma.auditLog.findMany({
      where: filter,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        election: { select: { id: true, title: true } }
      }
    });

    return res.json({
      logs,
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
 * 2. GET /api/audit/blockchain/status - Admin only
 * Returns the cached verification logs or queries and computes them in real-time.
 */
router.get('/blockchain/status', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const elections = await prisma.election.findMany();
    const results = [];

    for (const election of elections) {
      // Fetch the last 5 votes' cryptographic hashes
      const recentVotes = await prisma.vote.findMany({
        where: { election_id: election.id },
        orderBy: { cast_at: 'desc' },
        take: 5,
        select: {
          id: true,
          vote_hash: true,
          prev_hash: true,
          cast_at: true
        }
      });
      // Chronological progression for clean visualization left-to-right
      const recentVotesAsc = [...recentVotes].reverse();

      if (lastVerificationResults.has(election.id)) {
        const cached = lastVerificationResults.get(election.id);
        results.push({ ...cached, recentVotes: recentVotesAsc });
      } else {
        // compute on-the-fly to populate state correctly
        const votes = await prisma.vote.findMany({
          where: { election_id: election.id },
          orderBy: { cast_at: 'asc' }
        });

        const outcome = verifyChain(votes);
        const statusObj = {
          electionId: election.id,
          title: election.title,
          lastVerified: votes.length > 0 ? new Date().toISOString() : "Never (no votes cast)",
          valid: outcome.valid,
          totalVotes: votes.length,
          brokenAt: outcome.valid ? null : outcome.brokenAt,
          voteId: outcome.valid ? null : outcome.voteId
        };
        
        if (votes.length > 0) {
          lastVerificationResults.set(election.id, statusObj);
        }
        results.push({ ...statusObj, recentVotes: recentVotesAsc });
      }
    }

    res.json({ elections: results });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/audit/blockchain/verify-now/:electionId - Admin only
 * Manually executes an instant cryptographic chain inspection.
 */
router.post('/blockchain/verify-now/:electionId', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.electionId, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Invalid Election ID.' });
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    const votes = await prisma.vote.findMany({
      where: { election_id: electionId },
      orderBy: { cast_at: 'asc' }
    });

    const verificationResult = verifyChain(votes);

    // Fetch the last 5 votes
    const recentVotes = await prisma.vote.findMany({
      where: { election_id: electionId },
      orderBy: { cast_at: 'desc' },
      take: 5,
      select: {
        id: true,
        vote_hash: true,
        prev_hash: true,
        cast_at: true
      }
    });
    const recentVotesAsc = [...recentVotes].reverse();

    // Save in memory cache
    const statusObj = {
      electionId,
      title: election.title,
      lastVerified: new Date().toISOString(),
      valid: verificationResult.valid,
      totalVotes: verificationResult.totalVotes,
      brokenAt: verificationResult.valid ? null : verificationResult.brokenAt,
      voteId: verificationResult.valid ? null : verificationResult.voteId
    };
    lastVerificationResults.set(electionId, statusObj);

    // Record inspection to audit logs
    await logEvent(
      req.user.userId,
      "BLOCKCHAIN_VERIFICATION_MANUAL",
      `Blockchain manual verification performed for election "${election.title}". Valid: ${verificationResult.valid}. Total votes: ${verificationResult.totalVotes}.`,
      req.ip,
      electionId
    );

    // Emit live Socket.io alert to active administrators if tampering is detected
    if (!verificationResult.valid) {
      const io = req.app.get('io');
      if (io) {
        io.emit('blockchain:tamper_detected', {
          electionId,
          title: election.title,
          brokenAt: verificationResult.brokenAt,
          voteId: verificationResult.voteId,
          severity: 'CRITICAL'
        });
      }
    }

    return res.json({
      valid: verificationResult.valid,
      totalVotes: verificationResult.totalVotes,
      brokenAt: verificationResult.brokenAt,
      lastChecked: new Date(),
      recentVotes: recentVotesAsc
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. GET /api/audit/stats - Admin only
 * Provides aggregated logs, daily frequency, and anomaly trends in today's window.
 */
router.get('/stats', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const total_logs = await prisma.auditLog.count();
    const today_logs = await prisma.auditLog.count({
      where: {
        created_at: {
          gte: todayStart
        }
      }
    });

    const logGroups = await prisma.auditLog.groupBy({
      by: ['event_type'],
      _count: {
        id: true
      }
    });

    const events_by_type = {};
    logGroups.forEach((grp) => {
      events_by_type[grp.event_type] = grp._count.id;
    });

    const anomaly_count_today = await prisma.anomalyFlag.count({
      where: {
        created_at: {
          gte: todayStart
        }
      }
    });

    return res.json({
      total_logs,
      today_logs,
      events_by_type,
      anomaly_count_today
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Existing Endpoints kept for dashboard / security log backwards compatibility.
 */
router.get('/anomalies', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const { resolved } = req.query;
    const filter = {};
    
    if (resolved !== undefined) {
      filter.is_reviewed = resolved === 'true';
    }

    const anomalies = await prisma.anomalyFlag.findMany({
      where: filter,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.json(anomalies);
  } catch (err) {
    next(err);
  }
});

router.patch('/anomalies/:id/resolve', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const anomalyId = parseInt(req.params.id);
    if (isNaN(anomalyId)) {
      return res.status(400).json({ error: 'Anomaly ID format error.' });
    }

    const updatedAnomaly = await prisma.anomalyFlag.update({
      where: { id: anomalyId },
      data: { is_reviewed: true }
    });

    await prisma.auditLog.create({
      data: {
        user_id: parseInt(req.user.id, 10),
        event_type: 'SECURITY_ANOMALY_RESOLVED',
        description: `Security Anomaly ID ${anomalyId} reviewed and marked RESOLVED.`,
        ip_address: req.ip
      }
    });

    res.json({
      message: 'Anomaly flag reviewed and resolved.',
      anomaly: updatedAnomaly
    });
  } catch (err) {
    next(err);
  }
});

router.post('/trigger-anomaly', authenticateJWT, async (req, res, next) => {
  try {
    const { flag_type, ip_address, severity, details } = req.body;

    if (!flag_type || !ip_address || !severity || !details) {
      return res.status(400).json({ error: 'Flag specifications are incorrect.' });
    }

    const flag = await prisma.anomalyFlag.create({
      data: {
        flag_type,
        ip_address,
        voter_id: parseInt(req.user.id, 10),
        severity,
        details,
        is_reviewed: false
      }
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('anomaly_flagged', flag);
    }

    res.status(201).json({
      message: 'Demoware anomaly broadcast successfully. Dashboard alerts pushed to active channels.',
      flag
    });
  } catch (err) {
    next(err);
  }
});

export default router;
