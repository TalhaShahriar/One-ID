import { Router } from 'express';
import { prisma } from '../../prisma.js';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
import { computeVoteHash, verifyVoteChain, append as appendLedgerRecord } from '../../core/ledger.engine.js';
import { logEvent } from '../../core/audit.service.js';
import { runAllChecks } from '../../../services/anomalyEngine.js';
import { extractFingerprint } from '../../utils/deviceFingerprint.js';

const router = Router();

/**
 * POST /api/voting/votes/cast - Cast a secure anonymous vote.
 * Accessible to VOTER only.
 */
router.post('/cast', authenticateJWT, authorizeRoles('VOTER', 'CANDIDATE'), async (req, res, next) => {
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

    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });
    if (!election) {
      return res.status(400).json({ error: 'Selected election does not exist.' });
    }
    if (election.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Voting is only allowed for ACTIVE elections.' });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });
    if (!candidate || candidate.election_id !== electionId || candidate.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Selected candidate is invalid or not approved for this election.' });
    }

    const voter = await prisma.user.findUnique({
      where: { id: parseInt(req.user.userId, 10) }
    });

    if (candidate.constituency !== voter.constituency) {
      return res.status(403).json({ error: 'You are not eligible to vote for this constituency' });
    }

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

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${electionId})`);

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

      const lastVote = await tx.vote.findFirst({
        where: { election_id: electionId },
        orderBy: { cast_at: 'desc' }
      });
      const prevHash = lastVote ? lastVote.vote_hash : '0'.repeat(64);

      const newVoteId = uuidv4();
      const castAt = new Date();

      const voteHash = computeVoteHash(newVoteId, candidateId, electionId, castAt.toISOString(), prevHash);

      const vote = await tx.vote.create({
        data: {
          id: newVoteId,
          election_id: electionId,
          candidate_id: candidateId,
          constituency: voter.constituency,
          cast_at: castAt,
          prev_hash: prevHash,
          vote_hash: voteHash
        }
      });

      const token = uuidv4();
      await tx.voteToken.create({
        data: {
          token,
          vote_id: newVoteId
        }
      });

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

      const ledgerRecord = await appendLedgerRecord('VOTE', {
        eventType: 'BALLOT_CAST',
        electionId,
        constituency: voter.constituency || 'NATIONAL',
        voteId: newVoteId,
        integrityHash: voteHash
      }, tx);

      return { vote, token, castAt, ledgerRecordId: ledgerRecord.id };
    });

    const io = req.app.get('io');
    if (io) {
      const socketPayload = {
        election_id: electionId,
        candidate_id: candidateId,
        constituency: voter.constituency
      };
      io.to("election:" + electionId).emit("vote:cast", socketPayload);
      io.to("election_" + electionId).emit("vote:cast", socketPayload);
      io.emit("ledger:new_block", { sector: 'VOTE' });

      if (detectedAnomalies && detectedAnomalies.length > 0) {
        detectedAnomalies.forEach((flagData) => {
          if (flagData) {
            io.emit('anomaly:new', flagData);
          }
        });
      }
    }

    const verificationUrl = `${req.protocol}://${req.get('host')}/verify?token=${result.token}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    await logEvent(
      req.user.userId,
      "VOTE_CAST",
      `Vote cast in election ${electionId} (candidate not logged — privacy)`,
      req.ip,
      electionId
    );

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
 * GET /api/voting/votes/verify/:token - PUBLIC verification (no authentication required)
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
 * GET /api/voting/votes/history - Voter history lookup
 */
router.get('/history', authenticateJWT, authorizeRoles('VOTER', 'CANDIDATE'), async (req, res, next) => {
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
 * GET /api/voting/votes/blockchain/verify/:electionId - Verify integrity of complete blockchain
 */
router.get('/blockchain/verify/:electionId', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.electionId, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Invalid Election ID.' });
    }

    const votes = await prisma.vote.findMany({
      where: { election_id: electionId },
      orderBy: { cast_at: 'asc' }
    });

    const verificationResult = verifyVoteChain(votes);

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

/**
 * POST /api/voting/votes/seed-votes - Instantly seed random votes for a specific election
 * ADMIN and SUPER_ADMIN only
 */
router.post('/seed-votes', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { election_id, count } = req.body;
    
    if (!election_id) {
      return res.status(400).json({ error: 'Election ID is required.' });
    }

    const electionId = parseInt(election_id, 10);
    const numVotes = parseInt(count, 10) || 10;

    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election || election.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Election does not exist or is not ACTIVE.' });
    }

    const candidates = await prisma.candidate.findMany({
      where: { election_id: electionId, status: 'APPROVED' }
    });

    if (candidates.length === 0) {
      return res.status(400).json({ error: 'No approved candidates found for this election.' });
    }

    // Get voters who haven't voted in this election yet
    const voters = await prisma.user.findMany({
      where: {
        role: 'VOTER',
        voter_elections: {
          none: {
            election_id: electionId
          }
        }
      },
      take: numVotes
    });

    if (voters.length === 0) {
      return res.status(400).json({ error: 'No eligible voters available to seed votes.' });
    }

    const seededVotes = [];

    // Process votes sequentially to maintain hash chain
    for (const voter of voters) {
      const candidate = candidates[Math.floor(Math.random() * candidates.length)];
      
      const result = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${electionId})`);

        const lastVote = await tx.vote.findFirst({
          where: { election_id: electionId },
          orderBy: { cast_at: 'desc' }
        });
        const prevHash = lastVote ? lastVote.vote_hash : '0'.repeat(64);

        const newVoteId = uuidv4();
        const castAt = new Date();

        const voteHash = computeVoteHash(newVoteId, candidate.id, electionId, castAt.toISOString(), prevHash);

        const vote = await tx.vote.create({
          data: {
            id: newVoteId,
            election_id: electionId,
            candidate_id: candidate.id,
            constituency: candidate.constituency,
            cast_at: castAt,
            prev_hash: prevHash,
            vote_hash: voteHash
          }
        });

        const token = uuidv4();
        await tx.voteToken.create({
          data: {
            token,
            vote_id: newVoteId
          }
        });

        await tx.voterElection.create({
          data: {
            voter_id: voter.id,
            election_id: electionId,
            has_voted: true,
            voted_at: castAt
          }
        });

        const ledgerRecord = await appendLedgerRecord('VOTE', {
          eventType: 'BALLOT_CAST',
          electionId,
          constituency: candidate.constituency,
          voteId: newVoteId,
          integrityHash: voteHash
        }, tx);

        return { vote, token, castAt, ledgerRecordId: ledgerRecord.id };
      });
      seededVotes.push(result);
      
      const io = req.app.get('io');
      if (io) {
        const socketPayload = {
          election_id: electionId,
          candidate_id: candidate.id,
          constituency: candidate.constituency
        };
        io.to("election:" + electionId).emit("vote:cast", socketPayload);
        io.to("election_" + electionId).emit("vote:cast", socketPayload);
        io.emit("ledger:new_block", { sector: 'VOTE' });
      }
    }
    
    await logEvent(
      req.user.userId,
      "VOTES_SEEDED",
      `Bulk seeded ${seededVotes.length} random votes in election ${electionId}.`,
      req.ip,
      electionId
    );

    return res.status(201).json({
      message: `Successfully seeded ${seededVotes.length} votes.`,
      count: seededVotes.length
    });

  } catch (err) {
    next(err);
  }
});

export default router;
