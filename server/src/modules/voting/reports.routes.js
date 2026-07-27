import { Router } from 'express';
import { prisma } from '../../prisma.js';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
import { generateElectionResultPDF } from '../../shared/pdf.service.js';

const router = Router();

/**
 * GET /api/voting/reports/election/:id/pdf — Admin only
 */
router.get('/election/:id/pdf', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
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
 * GET /api/voting/reports/election/:id/csv — Admin only
 */
router.get('/election/:id/csv', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
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

    let csvString = 'Candidate,Party,Constituency,Votes,Percentage\n';

    candidates.forEach((cand) => {
      const votesVal = countsMap[cand.id] || 0;
      const percentVal = totalVotes > 0 ? ((votesVal / totalVotes) * 100).toFixed(2) : '0.00';

      const escName = `"${cand.user.name.replace(/"/g, '""')}"`;
      const escParty = cand.party ? `"${cand.party.name.replace(/"/g, '""')}"` : '"Independent"';
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
