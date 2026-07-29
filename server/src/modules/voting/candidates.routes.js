import { Router } from 'express';
import { prisma } from '../../prisma.js';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
import { logEvent } from '../../core/audit.service.js';
import { sendCandidateApprovalEmail, sendCandidateRejectionEmail } from '../../shared/email.service.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * GET /api/voting/candidates/parties
 * Retrieve all registered political parties from database
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
 * POST /api/voting/candidates/apply
 * Apply for candidacy
 */
router.post('/apply', authenticateJWT, authorizeRoles('VOTER', 'CANDIDATE'), async (req, res, next) => {
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

    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      return res.status(404).json({ error: 'The specified election does not exist.' });
    }

    if (election.status !== 'SCHEDULED') {
      return res.status(400).json({ error: 'Candidacy filings can only be accepted while the election is in SCHEDULED status.' });
    }

    const party = await prisma.party.findUnique({
      where: { id: partyId }
    });

    if (!party) {
      return res.status(404).json({ error: 'Associated political affiliate party not found.' });
    }

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
 * GET /api/voting/candidates/pending
 * Admin only - Get pending candidate applications
 */
router.get('/pending', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
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
 * PATCH /api/voting/candidates/:id/approve
 * Admin only - Approve candidacy
 */
router.patch('/:id/approve', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
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
    
    // Update user role to CANDIDATE
    await prisma.user.update({
      where: { id: candidate.user_id },
      data: { role: 'CANDIDATE' }
    });

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
 * PATCH /api/voting/candidates/:id/reject
 * Admin only - Reject candidacy
 */
router.patch('/:id/reject', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
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
 * GET /api/voting/candidates/my-applications
 * Voter / Candidates log retrieval
 */
router.get('/my-applications', authenticateJWT, authorizeRoles('VOTER', 'CANDIDATE'), async (req, res, next) => {
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

/**
 * POST /api/voting/candidates/seed-test
 * Instantly seed approved test candidates for a specific election & constituency to accelerate verification testing.
 */
router.post('/seed-test', authenticateJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { election_id, constituency } = req.body;

    if (!election_id || !constituency) {
      return res.status(400).json({ error: 'Election ID and constituency are required.' });
    }

    const electionId = parseInt(election_id, 10);
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      return res.status(404).json({ error: 'The specified election does not exist.' });
    }

    // Ensure we have at least some parties in the DB to associate candidates to
    let parties = await prisma.party.findMany();
    if (parties.length === 0) {
      const partiesData = [
        {
          name: 'Awami League',
          abbreviation: 'AL',
          symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Bangladesh_Awami_League_Logo.svg',
        },
        {
          name: 'Bangladesh Nationalist Party',
          abbreviation: 'BNP',
          symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Nationalist_Party_BP.svg',
        },
        {
          name: 'Jatiya Party',
          abbreviation: 'JP',
          symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Jatiya_Party_logo.png',
        },
      ];
      for (const p of partiesData) {
        await prisma.party.create({ data: p });
      }
      parties = await prisma.party.findMany();
    }

    const demoCandidates = [
      {
        name: 'Dr. Kamal Hossain',
        partyAbbr: 'AL',
        education: 'Ph.D. in Public Policy, Oxford',
        occupation: 'Constitutional Lawyer',
        manifesto: 'Promoting institutional accountability, green energy grids, and modernized high-speed transit networks for the constituency.',
        photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      },
      {
        name: 'Barrister Sara Hossain',
        partyAbbr: 'BNP',
        education: 'LL.M., Harvard Law School',
        occupation: 'Human Rights Advocate',
        manifesto: 'Ensuring equal citizen representation, community health networks, and free legal aid resources for all local residents.',
        photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      },
      {
        name: 'Saber Chowdhury',
        partyAbbr: 'JP',
        education: 'M.Sc. in Environmental Sciences, Imperial College',
        occupation: 'Ecology Specialist',
        manifesto: 'Championing flood resilience infrastructure, localized waste recycling systems, and technical training centers for youth.',
        photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      }
    ];

    const candHash = await bcrypt.hash('Test@123', 10);
    const createdCandidates = [];

    for (const d of demoCandidates) {
      // Find matching party
      const party = parties.find(p => p.abbreviation === d.partyAbbr) || parties[0];
      
      const randSuff = Math.floor(100000 + Math.random() * 900000);
      const email = `testcand_${d.partyAbbr.toLowerCase()}_${randSuff}@oneid.bd`;
      const nidString = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const nid_hash = crypto.createHash('sha256').update(nidString).digest('hex');
      const phone = `+88017${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Create candidate user
      const user = await prisma.user.create({
        data: {
          name: d.name,
          email,
          phone,
          nid_hash,
          password_hash: candHash,
          role: 'CANDIDATE',
          constituency,
          is_verified: true,
        }
      });

      // Create Candidate record in database as APPROVED
      const candidate = await prisma.candidate.create({
        data: {
          user_id: user.id,
          election_id: electionId,
          party_id: party.id,
          constituency,
          photo_url: d.photo_url,
          date_of_birth: new Date('1980-01-01'),
          education: d.education,
          occupation: d.occupation,
          manifesto: d.manifesto,
          status: 'APPROVED',
          approved_at: new Date()
        },
        include: {
          user: { select: { name: true, email: true } },
          party: true
        }
      });

      createdCandidates.push(candidate);
    }

    await logEvent(
      req.user.userId,
      'CANDIDATE_SEEDED',
      `Bulk seeded ${createdCandidates.length} test candidates in constituency "${constituency}" for election "${election.title}".`,
      req.ip,
      electionId
    );

    res.status(201).json({
      message: `Successfully seeded ${createdCandidates.length} test candidates for ${constituency}.`,
      candidates: createdCandidates
    });
  } catch (err) {
    next(err);
  }
});

export default router;
