import { Router } from 'express';
import { prisma } from '../../prisma.js';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
import { logEvent } from '../../core/audit.service.js';

const router = Router();

/**
 * POST /api/voting/elections
 * Admin only - Create and schedule a new election
 */
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      election_type, 
      administrative_unit, 
      constituency_scope, 
      start_at, 
      end_at 
    } = req.body;

    if (!title || !description || !election_type || !administrative_unit || !constituency_scope || !start_at || !end_at) {
      return res.status(400).json({ error: 'All parameters for scheduling election are required.' });
    }

    const startDateTime = new Date(start_at);
    const endDateTime = new Date(end_at);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end date format.' });
    }

    if (startDateTime <= new Date()) {
      return res.status(400).json({ error: 'Election start_at date must be scheduled in the future.' });
    }

    if (startDateTime >= endDateTime) {
      return res.status(400).json({ error: 'Election end_at date must succeed the start_at date.' });
    }

    const election = await prisma.election.create({
      data: {
        title,
        description,
        election_type,
        administrative_unit,
        constituency_scope,
        status: 'SCHEDULED',
        start_at: startDateTime,
        end_at: endDateTime,
        created_by: parseInt(req.user.userId, 10)
      }
    });

    await logEvent(
      req.user.userId, 
      'ELECTION_CREATED', 
      `Election titled "${title}" successfully scheduled under unit ${administrative_unit}.`, 
      req.ip, 
      election.id
    );

    if (req.app.get('io')) {
      req.app.get('io').emit('election:status_changed', { 
        electionId: election.id, 
        status: 'SCHEDULED', 
        title: election.title 
      });
    }

    res.status(201).json(election);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/voting/elections
 * Authenticated role-filtered listing of elections
 */
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    const role = req.user.role;
    
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const elections = await prisma.election.findMany({
        include: {
          _count: {
            select: { candidates: true, votes: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      return res.json(elections);
    } 
    
    if (role === 'VOTER') {
      const voterConstituency = req.user.constituency;
      const elections = await prisma.election.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { constituency_scope: voterConstituency },
            { constituency_scope: { contains: voterConstituency, mode: 'insensitive' } },
            { constituency_scope: 'ALL' },
            { constituency_scope: 'NATIONAL' }
          ]
        },
        include: {
          _count: {
            select: { candidates: true, votes: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      return res.json(elections);
    }

    if (role === 'CANDIDATE') {
      const elections = await prisma.election.findMany({
        where: {
          status: { in: ['SCHEDULED', 'ACTIVE'] }
        },
        include: {
          _count: {
            select: { candidates: true, votes: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      return res.json(elections);
    }

    res.status(403).json({ error: 'Access denied. Unrecognized role context.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/voting/elections/admin/dashboard-stats
 * Admin only - retrieves summary statistics for admin
 */
router.get('/admin/dashboard-stats', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const totalElections = await prisma.election.count();
    const activeElections = await prisma.election.count({
      where: { status: 'ACTIVE' }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalVotesToday = await prisma.vote.count({
      where: {
        cast_at: {
          gte: startOfToday
        }
      }
    });

    const pendingCandidates = await prisma.candidate.count({
      where: { status: 'PENDING' }
    });

    const totalVoters = await prisma.user.count({
      where: { role: 'VOTER' }
    });

    return res.json({
      totalElections,
      activeElections,
      totalVotesToday,
      pendingCandidates,
      totalVoters
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/voting/elections/:id
 * Retrieve details of a specific election
 */
router.get('/:id', authenticateJWT, async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Election ID must be numeric.' });
    }

    const { role } = req.user;

    const candidateFilter = {
      status: 'APPROVED'
    };

    if (role === 'VOTER') {
      candidateFilter.constituency = req.user.constituency;
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: {
          where: candidateFilter,
          include: {
            user: { select: { name: true, email: true } },
            party: true
          }
        },
        _count: {
          select: { votes: true, candidates: true }
        }
      }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    res.json(election);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/voting/elections/:id
 * Admin update parameters
 */
router.patch('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Election ID must be numeric.' });
    }

    const electionCurrent = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!electionCurrent) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    if (electionCurrent.status === 'CLOSED' || electionCurrent.status === 'CANCELLED' || electionCurrent.status === 'RESULTS_PUBLISHED') {
      return res.status(400).json({ error: 'Closed or published elections cannot receive parameter changes.' });
    }

    const { title, description, start_at, end_at, election_type, administrative_unit, constituency_scope } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (election_type !== undefined) updateData.election_type = election_type;
    if (administrative_unit !== undefined) updateData.administrative_unit = administrative_unit;
    if (constituency_scope !== undefined) updateData.constituency_scope = constituency_scope;

    if (start_at !== undefined) {
      const d = new Date(start_at);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid start date format.' });
      updateData.start_at = d;
    }

    if (end_at !== undefined) {
      const d = new Date(end_at);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid end date format.' });
      updateData.end_at = d;
    }

    const finalStart = updateData.start_at || electionCurrent.start_at;
    const finalEnd = updateData.end_at || electionCurrent.end_at;
    if (finalStart >= finalEnd) {
      return res.status(400).json({ error: 'The scheduled end date must follow the start date.' });
    }

    const updatedElection = await prisma.election.update({
      where: { id: electionId },
      data: updateData
    });

    await logEvent(
      req.user.userId,
      'ELECTION_UPDATED',
      `Election "${electionCurrent.title}" parameters changed by administrator.`,
      req.ip,
      electionId
    );

    res.json(updatedElection);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/voting/elections/:id
 * Cancel / purge election
 */
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Election ID must be numeric.' });
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        _count: { select: { votes: true } }
      }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    if (election.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Only pending scheduled elections can be securely purged.' });
    }

    if (election._count.votes > 0) {
      return res.status(400).json({ error: 'Cannot delete an election that already contains vote transactions.' });
    }

    await prisma.candidate.deleteMany({
      where: { election_id: electionId }
    });

    await prisma.election.delete({
      where: { id: electionId }
    });

    await logEvent(
      req.user.userId,
      'ELECTION_DELETED',
      `Election titled "${election.title}" completely deleted from registry.`,
      req.ip,
      electionId
    );

    res.json({ message: 'Election successfully deleted from secure node.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/voting/elections/:id/results
 * Returns results
 */
router.get('/:id/results', authenticateJWT, async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Election ID must be numeric.' });
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    if (election.status !== 'CLOSED' && election.status !== 'RESULTS_PUBLISHED' && !isAdmin) {
      return res.status(403).json({ error: 'Election results are locked until the ballot box closes.' });
    }

    const voteGroups = await prisma.vote.groupBy({
      by: ['candidate_id'],
      where: { election_id: electionId },
      _count: { _all: true }
    });

    const countsMap = {};
    voteGroups.forEach((group) => {
      countsMap[group.candidate_id] = group._count._all;
    });

    const candidates = await prisma.candidate.findMany({
      where: { election_id: electionId, status: 'APPROVED' },
      include: {
        user: { select: { name: true, email: true } },
        party: true
      }
    });

    const candidatesWithVotes = candidates.map((cand) => {
      const votes = countsMap[cand.id] || 0;
      return {
        id: cand.id,
        name: cand.user.name,
        email: cand.user.email,
        constituency: cand.constituency,
        photo_url: cand.photo_url,
        party: cand.party ? {
          id: cand.party.id,
          name: cand.party.name,
          abbreviation: cand.party.abbreviation,
          symbol_url: cand.party.symbol_url
        } : null,
        votesCount: votes
      };
    });

    candidatesWithVotes.sort((a, b) => b.votesCount - a.votesCount);

    const resultPayload = {
      election,
      candidates: candidatesWithVotes,
      fptpWinners: [],
      partyDirectSeats: {},
      reservedSeats: {}
    };

    if (election.election_type === 'NATIONAL') {
      const constituencyGroups = {};
      candidatesWithVotes.forEach((cand) => {
        if (!constituencyGroups[cand.constituency]) {
          constituencyGroups[cand.constituency] = [];
        }
        constituencyGroups[cand.constituency].push(cand);
      });

      const fptpWinners = [];
      const partyDirectSeats = {};

      Object.keys(constituencyGroups).forEach((constRef) => {
        const contenders = constituencyGroups[constRef];
        contenders.sort((x, y) => y.votesCount - x.votesCount);
        const winner = contenders[0];

        if (winner && winner.votesCount > 0) {
          fptpWinners.push({
            constituency: constRef,
            winnerCandidateId: winner.id,
            winnerName: winner.name,
            partyName: winner.party ? winner.party.name : 'Independent',
            partyAbbreviation: winner.party ? winner.party.abbreviation : 'IND',
            votesCount: winner.votesCount
          });

          const pName = winner.party ? winner.party.name : 'Independent';
          partyDirectSeats[pName] = (partyDirectSeats[pName] || 0) + 1;
        }
      });

      const reservedSeats = {};
      Object.keys(partyDirectSeats).forEach((pName) => {
        const directSeats = partyDirectSeats[pName] || 0;
        reservedSeats[pName] = Math.floor((directSeats / 300) * 50);
      });

      resultPayload.fptpWinners = fptpWinners;
      resultPayload.partyDirectSeats = partyDirectSeats;
      resultPayload.reservedSeats = reservedSeats;
    }

    res.json(resultPayload);
  } catch (err) {
    next(err);
  }
});

export default router;
