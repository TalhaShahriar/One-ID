import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { generateElectionResultPDF } from '../services/reportGenerator.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/reports/election/:id/pdf — Admin only
 * Generates an executive A4 multipage results report featuring standard turnout metrics
 * and a secure cryptographic SHA-256 chain verification verdict.
 */
router.get('/election/:id/pdf', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Invalid Election ID parameter format.' });
    }

    const pdfBytes = await generateElectionResultPDF(electionId, prisma);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="votechain-election-${electionId}-results.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error in PDF generation route:', err);
    next(err);
  }
});

/**
 * GET /api/reports/election/:id/csv — Admin only
 * Compiles a scannable standard-comma separated table with candidate performance
 * rankings, overall share, and constituency tags.
 */
router.get('/election/:id/csv', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const electionId = parseInt(req.params.id, 10);
    if (isNaN(electionId)) {
      return res.status(400).json({ error: 'Invalid Election ID parameter format.' });
    }

    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      return res.status(404).json({ error: 'Election not found in database.' });
    }

    const candidates = await prisma.candidate.findMany({
      where: { election_id: electionId, status: 'APPROVED' },
      include: {
        user: { select: { name: true } },
        party: { select: { name: true } }
      }
    });

    const voteGroups = await prisma.vote.groupBy({
      by: ['candidate_id'],
      where: { election_id: electionId },
      _count: { _all: true }
    });

    const countsMap = {};
    voteGroups.forEach((group) => {
      countsMap[group.candidate_id] = group._count._all;
    });

    const totalVotes = await prisma.vote.count({
      where: { election_id: electionId }
    });

    // Compile standard header
    let csvString = 'Candidate,Party,Constituency,Votes,Percentage\n';

    candidates.forEach((cand) => {
      const votesVal = countsMap[cand.id] || 0;
      const percentVal = totalVotes > 0 ? ((votesVal / totalVotes) * 100).toFixed(2) : '0.00';

      const escName = `"${cand.user.name.replace(/"/g, '""')}"`;
      const escParty = `"${cand.party.name.replace(/"/g, '""')}"`;
      const escConst = `"${cand.constituency.replace(/"/g, '""')}"`;

      csvString += `${escName},${escParty},${escConst},${votesVal},${percentVal}%\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="votechain-results-${electionId}.csv"`);
    return res.send(csvString);
  } catch (err) {
    console.error('Error in CSV generation route:', err);
    next(err);
  }
});

export default router;
