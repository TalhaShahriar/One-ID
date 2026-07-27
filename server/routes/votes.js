import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { computeVoteHash, verifyChain } from '../utils/blockchain.js';
import { logEvent } from '../utils/audit.js';
import { runAllChecks } from '../services/anomalyEngine.js';
import { extractFingerprint } from '../utils/deviceFingerprint.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/votes/cast - Cast a secure anonymous vote.
 * Accessible to VOTER only.
 */
router.post('/cast', authenticateJWT, authorizeRoles('VOTER'), async (req, res, next) => {
  try {
    const { election_id, candidate_id } = req.body;

    if (!election_id || !candidate_id) {
      return res.status(400).json({ error: 'Election ID and Candidate ID are required.' });
    }

    const electionId = parseInt(election_id, 10);
    const candidateId = parseInt(candidate_id, 10);

    if (isNaN(electionId) || isNaN(candidateId)) {
      return res.status(400).json({ error: 'Invalid ID formats. Must be integers.' });
    }

    // --- STEP 1: Pre-checks (fast, outside of transaction) ---

    // a. Find election -> must exist and status === 'ACTIVE'
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });
    if (!election) {
      return res.status(400).json({ error: 'Selected election does not exist.' });
    }
    if (election.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Voting is only allowed for ACTIVE elections.' });
    }

    // b. Find candidate -> must exist, status=APPROVED, election_id matches
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });
    if (!candidate || candidate.election_id !== electionId || candidate.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Selected candidate is invalid or not approved for this election.' });
    }

    // c. Check voter eligibility in constituency
    if (candidate.constituency !== req.user.constituency) {
      return res.status(403).json({ error: 'You are not eligible to vote for this constituency' });
    }

    // d. Check if voter has already voted
    const priorVote = await prisma.voterElection.findUnique({
      where: {
        voter_id_election_id: {
          voter_id: parseInt(req.user.userId, 10),
          election_id: electionId
        }
      }
    });
    if (priorVote && priorVote.has_voted) {
      return res.status(403).json({ error: 'You have already voted in this election' });
    }

    // --- STEP 1.5: Run AI / Rule-based Fraud Detection Anomaly Engine ---
    let detectedAnomalies = [];
    try {
      const fingerprint = extractFingerprint(req);
      detectedAnomalies = await runAllChecks({
        ip: req.ip,
        voterId: parseInt(req.user.userId, 10),
        electionId,
        fingerprint,
        prisma
      });
    } catch (anomErr) {
      console.error('⚠️ Anomaly engine skipped due to error:', anomErr);
    }

    // --- STEP 2: Atomic Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      // Re-verify voter has voted inside transaction for robust thread-safety
      const activeCheck = await tx.voterElection.findUnique({
        where: {
          voter_id_election_id: {
            voter_id: parseInt(req.user.userId, 10),
            election_id: electionId
          }
        }
      });
      if (activeCheck && activeCheck.has_voted) {
        throw { code: 'P2002', message: 'Thread-safe double voting prevention' };
      }

      // a. Get last vote for this election (hash chain context)
      const lastVote = await tx.vote.findFirst({
        where: { election_id: electionId },
        orderBy: { cast_at: 'desc' }
      });
      const prevHash = lastVote ? lastVote.vote_hash : '0'.repeat(64);

      // b. Generate new vote ID and secure cast timestamp
      const newVoteId = uuidv4();
      const castAt = new Date();

      // c. Compute SHA-256 blockchain hash block
      const voteHash = computeVoteHash(newVoteId, candidateId, electionId, castAt.toISOString(), prevHash);

      // d. Create Vote (No voter_id is tied directly to preserve secrecy)
      const vote = await tx.vote.create({
        data: {
          id: newVoteId,
          election_id: electionId,
          candidate_id: candidateId,
          constituency: req.user.constituency,
          cast_at: castAt,
          prev_hash: prevHash,
          vote_hash: voteHash
        }
      });

      // e. Create blind cryptographic receipt token
      const token = uuidv4();
      await tx.voteToken.create({
        data: {
          token,
          vote_id: newVoteId
        }
      });

      // f. Mark voter as voted
      await tx.voterElection.upsert({
        where: {
          voter_id_election_id: {
            voter_id: parseInt(req.user.userId, 10),
            election_id: electionId
          }
        },
        create: {
          voter_id: parseInt(req.user.userId, 10),
          election_id: electionId,
          has_voted: true,
          voted_at: castAt
        },
        update: {
          has_voted: true,
          voted_at: castAt
        }
      });

      return { vote, token, castAt };
    });

    // --- STEP 3: After Transaction Actions ---

    // a. Emit Socket.io event to room "election:<electionId>" and "election_<electionId>" to refresh stats safely
    const io = req.app.get('io');
    if (io) {
      const socketPayload = {
        election_id: electionId,
        candidate_id: candidateId,
        constituency: req.user.constituency
      };
      io.to("election:" + electionId).emit("vote:cast", socketPayload);
      io.to("election_" + electionId).emit("vote:cast", socketPayload);

      // Emit new anomalies if any were found
      if (detectedAnomalies && detectedAnomalies.length > 0) {
        detectedAnomalies.forEach((flagData) => {
          if (flagData) {
            io.emit('anomaly:new', flagData);
          }
        });
      }
    }

    // b. Generate QR code link referencing receipt token
    const verificationUrl = `${req.protocol}://${req.get('host')}/verify?token=${result.token}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    // c. Log immutable audit trail event (never link candidate_id to preserve absolute privacy)
    await logEvent(
      req.user.userId,
      "VOTE_CAST",
      `Vote cast in election ${electionId} (candidate not logged — privacy)`,
      req.ip,
      electionId
    );

    // d. Return 200 payload
    return res.status(200).json({
      receiptToken: result.token,
      qrCodeDataUrl,
      message: 'Vote cast successfully',
      castAt: result.castAt
    });

  } catch (err) {
    if (err.code === 'P2002' || err.message === 'Thread-safe double voting prevention') {
      return res.status(403).json({ error: 'Duplicate vote detected' });
    }
    next(err);
  }
});

/**
 * GET /api/votes/verify/:token - PUBLIC verification (no authentication required)
 * Determines validity of cryptographic receipt token. Excludes candidate ID, names, or voter identity.
 */
router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Receipt verification token is required.' });
    }

    const voteToken = await prisma.voteToken.findUnique({
      where: { token },
      include: {
        vote: {
          include: {
            election: {
              select: {
                title: true,
                election_type: true
              }
            }
          }
        }
      }
    });

    if (!voteToken) {
      return res.status(200).json({ valid: false, message: 'Token not found' });
    }

    const { vote } = voteToken;
    return res.status(200).json({
      valid: true,
      vote_id: vote.id,
      cast_at: vote.cast_at,
      election: {
        title: vote.election.title,
        election_type: vote.election.election_type
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/votes/history - Voter history lookup
 * Accessible to authenticated database users logged in as VOTER.
 */
router.get('/history', authenticateJWT, authorizeRoles('VOTER'), async (req, res, next) => {
  try {
    const history = await prisma.voterElection.findMany({
      where: {
        voter_id: parseInt(req.user.userId, 10),
        has_voted: true
      },
      include: {
        election: {
          select: {
            id: true,
            title: true,
            status: true,
            end_at: true
          }
        }
      }
    });

    // Format safe checklist. Do NOT include what candidate was voted for
    const formattedHistory = history.map((item) => ({
      election_id: item.election_id,
      voted_at: item.voted_at,
      election: {
        title: item.election.title,
        status: item.election.status,
        end_at: item.election.end_at
      }
    }));

    return res.json(formattedHistory);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/votes/blockchain/verify/:electionId - Verify integrity of complete blockchain
 * Accessible to ADMIN only.
 */
router.get('/blockchain/verify/:electionId', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.electionId, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Invalid Election ID.' });
    }

    // Fetch all votes ordered by cast_at ascending to verify blockchain chain
    const votes = await prisma.vote.findMany({
      where: { election_id: electionId },
      orderBy: { cast_at: 'asc' }
    });

    const verificationResult = verifyChain(votes);

    // Record inspection to audit trail
    await logEvent(
      req.user.userId,
      "BLOCKCHAIN_VERIFICATION",
      `Blockchain audit executed for election ID ${electionId}. Valid: ${verificationResult.valid}. Total count: ${verificationResult.totalVotes}.`,
      req.ip,
      electionId
    );

    return res.json({
      valid: verificationResult.valid,
      totalVotes: verificationResult.totalVotes,
      brokenAt: verificationResult.brokenAt,
      lastChecked: new Date()
    });

  } catch (err) {
    next(err);
  }
});

export default router;
