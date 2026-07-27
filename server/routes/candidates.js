import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { logEvent } from '../utils/audit.js';
import { sendCandidateApprovalEmail, sendCandidateRejectionEmail } from '../utils/email.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/candidates/parties
 * Retrieve all registered political parties from the database
 */
router.get('/parties', authenticateJWT, async (req, res, next) => {
  try {
    const parties = await prisma.party.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(parties);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/candidates/apply
 * Role: CANDIDATE / Any authenticated user who wants to submit a profile application
 */
router.post('/apply', authenticateJWT, authorizeRoles('CANDIDATE'), async (req, res, next) => {
  try {
    const { 
      election_id, 
      party_id, 
      constituency, 
      photo_url, 
      date_of_birth, 
      education, 
      occupation, 
      manifesto 
    } = req.body;

    if (!election_id || !party_id || !constituency || !photo_url || !date_of_birth || !education || !occupation || !manifesto) {
      return res.status(400).json({ error: 'All application file parameters are mandatory.' });
    }

    if (manifesto.length > 500) {
      return res.status(400).json({ error: 'Candidacy manifesto must not exceed 500 characters.' });
    }

    const electionId = parseInt(election_id, 10);
    const partyId = parseInt(party_id, 10);

    // Verify target election exists and is SCHEDULED
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      return res.status(404).json({ error: 'The specified election does not exist.' });
    }

    if (election.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Candidacy filings can only be accepted while the election is in SCHEDULED status.' });
    }

    // Verify party exists
    const party = await prisma.party.findUnique({
      where: { id: partyId }
    });

    if (!party) {
      return res.status(404).json({ error: 'Associated political affiliate party not found.' });
    }

    // Verify no prior applications exists
    const existingApplication = await prisma.candidate.findFirst({
      where: {
        user_id: parseInt(req.user.userId, 10),
        election_id: electionId
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already filed a candidacy application for this election cycle.' });
    }

    const candidate = await prisma.candidate.create({
      data: {
        user_id: parseInt(req.user.userId, 10),
        election_id: electionId,
        party_id: partyId,
        constituency,
        photo_url,
        date_of_birth: new Date(date_of_birth),
        education,
        occupation,
        manifesto,
        status: 'PENDING'
      }
    });

    await logEvent(
      req.user.userId,
      'CANDIDATE_APPLIED',
      `Candidacy filed for election: "${election.title}" under ${party.name} (${constituency}).`,
      req.ip,
      electionId
    );

    // Broadcast submission update to active socket terminals
    if (req.app.get('io')) {
      req.app.get('io').emit('candidate:applied', { 
        candidateId: candidate.id, 
        electionId: electionId, 
        partyName: party.name 
      });
    }

    res.status(201).json(candidate);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/candidates/pending
 * Admin only - Get all candidate applications that have a status of PENDING
 */
router.get('/pending', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const pendingCandidates = await prisma.candidate.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        election: { select: { title: true, election_type: true } },
        party: { select: { name: true, abbreviation: true, symbol_url: true } }
      },
      orderBy: { created_at: 'asc' }
    });

    res.json(pendingCandidates);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/candidates/:id/approve
 * Admin only - Approve candidate application
 */
router.patch('/:id/approve', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    if (isNaN(candidateId)) {
      return res.status(400).json({ error: 'Candidate ID must be numeric.' });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        user: { select: { name: true, email: true } },
        election: { select: { title: true, id: true } }
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidacy application file not found.' });
    }

    if (candidate.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot approve application with a status of ${candidate.status}` });
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        status: 'APPROVED',
        approved_at: new Date()
      }
    });

    // Fire verification notification mail to candidate
    await sendCandidateApprovalEmail(
      candidate.user.email, 
      candidate.user.name, 
      candidate.election.title
    );

    await logEvent(
      req.user.userId,
      'CANDIDATE_APPROVED',
      `Approved candidate "${candidate.user.name}" for "${candidate.election.title}".`,
      req.ip,
      candidate.election.id
    );

    // Broadcast candidate status revision to live socket clients
    if (req.app.get('io')) {
      req.app.get('io').emit('candidate:status_changed', { 
        candidateId, 
        status: 'APPROVED' 
      });
    }

    res.json(updatedCandidate);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/candidates/:id/reject
 * Admin only - Reject candidate application with reason
 */
router.patch('/:id/reject', authenticateJWT, authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const candidateId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    if (isNaN(candidateId)) {
      return res.status(400).json({ error: 'Candidate ID must be numeric.' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'A rejection justification explanation is required.' });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        user: { select: { name: true, email: true } },
        election: { select: { title: true, id: true } }
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidacy application file not found.' });
    }

    if (candidate.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot reject application with a status of ${candidate.status}` });
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        status: 'REJECTED',
        rejection_reason: reason
      }
    });

    // Fire rejection feedback mail to candidate
    await sendCandidateRejectionEmail(
      candidate.user.email, 
      candidate.user.name, 
      reason
    );

    await logEvent(
      req.user.userId,
      'CANDIDATE_REJECTED',
      `Rejected candidate "${candidate.user.name}" for "${candidate.election.title}". Reason: ${reason}`,
      req.ip,
      candidate.election.id
    );

    // Broadcast candidate status revision to live socket clients
    if (req.app.get('io')) {
      req.app.get('io').emit('candidate:status_changed', { 
        candidateId, 
        status: 'REJECTED' 
      });
    }

    res.json(updatedCandidate);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/candidates/my-applications
 * Candidate role only - Retrieves personal application logs
 */
router.get('/my-applications', authenticateJWT, authorizeRoles('CANDIDATE'), async (req, res, next) => {
  try {
    const applications = await prisma.candidate.findMany({
      where: { user_id: parseInt(req.user.userId, 10) },
      include: {
        election: { select: { id: true, title: true, status: true, start_at: true, end_at: true } },
        party: { select: { id: true, name: true, abbreviation: true, symbol_url: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(applications);
  } catch (err) {
    next(err);
  }
});

export default router;
