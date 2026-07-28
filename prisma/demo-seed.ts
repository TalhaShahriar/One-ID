import 'dotenv/config';
import { PrismaClient, Role, ElectionType, ElectionStatus, CandidateStatus, FlagType, Severity } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function computeVoteHash(voteId: string, candidateId: number, electionId: number, timestamp: string, prevHash: string): string {
  const data = [voteId, candidateId, electionId, timestamp, prevHash].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function main() {
  console.log('🚀 Initiating VoteChain BD Exact Presentation Demo Seeder...');

  const pwd1234 = await bcrypt.hash('Test@1234', 10);
  const pwd123 = await bcrypt.hash('Test@123', 10);

  // 1. Resolve Admins or seed if not exists
  const adminAccounts = [
    { name: 'Arif Hossain', email: 'arif@oneid.test', role: Role.SUPER_ADMIN, pwd: pwd1234, oneid: 'BD-2026-ADMIN001' },
    { name: 'Nusrat Jahan', email: 'nusrat@election.test', role: Role.ADMIN, pwd: pwd1234, oneid: 'BD-2026-ADMIN002' },
    { name: 'Kamal Uddin', email: 'kamal@nbr.test', role: Role.TAX_ADMIN, pwd: pwd1234, oneid: 'BD-2026-ADMIN003' },
    { name: 'Sabbir Rahman', email: 'sabbir@brta.test', role: Role.VEHICLE_ADMIN, pwd: pwd1234, oneid: 'BD-2026-ADMIN004' },
    { name: 'Fatema Khatun', email: 'fatema@land.test', role: Role.PROPERTY_ADMIN, pwd: pwd1234, oneid: 'BD-2026-ADMIN005' },
    { name: 'Moulana Ibrahim', email: 'ibrahim@kazi.test', role: Role.KAZI_ADMIN, pwd: pwd1234, oneid: 'BD-2026-KAZI001' },
    { name: 'Chairman Abdul Mannan', email: 'mannan@dhaka-up.test', role: Role.LOCAL_AUTHORITY_ADMIN, pwd: pwd1234, oneid: 'BD-2026-CHAIR01' },
  ];

  let mainAdmin = null;
  for (const account of adminAccounts) {
    let existing = await prisma.user.findFirst({ where: { email: account.email } });
    if (!existing) {
      existing = await prisma.user.create({
        data: {
          name: account.name,
          email: account.email,
          phone: `+880170000000${Math.floor(Math.random() * 9)}`,
          nid_hash: crypto.createHash('sha256').update(account.email).digest('hex'),
          password_hash: account.pwd,
          role: account.role,
          constituency: 'Dhaka-1',
          is_verified: true,
          oneid: account.oneid
        }
      });
      console.log(`✅ Admin created: ${existing.email} (${account.role})`);
    } else {
      // update password and oneid just in case
      await prisma.user.update({
        where: { id: existing.id },
        data: { password_hash: account.pwd, oneid: account.oneid }
      });
      console.log(`ℹ️ Admin updated: ${existing.email}`);
    }
    if (account.role === Role.ADMIN) {
      mainAdmin = existing;
    }
  }

  // 2. Resolve Parties or seed if not exist
  const partiesData = [
    { name: 'Awami League', abbreviation: 'AL', symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Bangladesh_Awami_League_Logo.svg' },
    { name: 'Bangladesh Nationalist Party', abbreviation: 'BNP', symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Nationalist_Party_BP.svg' },
    { name: 'Jatiya Party', abbreviation: 'JP', symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Jatiya_Party_logo.png' },
  ];

  const partiesMap: Record<string, any> = {};
  for (const party of partiesData) {
    let existingParty = await prisma.party.findFirst({ where: { abbreviation: party.abbreviation } });
    if (!existingParty) {
      existingParty = await prisma.party.create({ data: party });
    }
    partiesMap[party.abbreviation] = existingParty;
  }

  // 3. Clear old demo elections & cascade dependencies
  console.log('🧹 Formatting pre-existing Demo Election records for a clean slate...');
  const existingDemoElections = await prisma.election.findMany({
    where: { title: { contains: "Demo" } }
  });

  for (const el of existingDemoElections) {
    await prisma.anomalyFlag.deleteMany({ where: { election_id: el.id } });
    await prisma.auditLog.deleteMany({ where: { election_id: el.id } });
    await prisma.voteToken.deleteMany({ where: { vote: { election_id: el.id } } });
    await prisma.vote.deleteMany({ where: { election_id: el.id } });
    await prisma.voterElection.deleteMany({ where: { election_id: el.id } });
    await prisma.candidate.deleteMany({ where: { election_id: el.id } });
    await prisma.election.delete({ where: { id: el.id } });
  }

  const now = new Date();

  // --- ELECTION 1: ACTIVE ---
  console.log('🗳️ Creating ACTIVE Election (Dhaka-1 By-Election Demo)...');
  const activeElection = await prisma.election.create({
    data: {
      title: 'Dhaka-1 Constituency By-Election Demo',
      description: 'An active localized model representation of the VoteChain BD cryptographic ledger system with real-time audit logs.',
      election_type: ElectionType.NATIONAL,
      administrative_unit: 'Dhaka Division',
      constituency_scope: 'Dhaka-1',
      status: ElectionStatus.ACTIVE,
      start_at: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      end_at: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      created_by: mainAdmin!.id,
    }
  });

  // --- ELECTION 2: RESULTS PUBLISHED ---
  console.log('🗳️ Creating CLOSED Election (Dhaka-2 National Demo)...');
  const closedElection = await prisma.election.create({
    data: {
      title: 'Dhaka-2 National Assembly Demo',
      description: 'A completed election to demonstrate the Results and Analytics Dashboard with final tallies.',
      election_type: ElectionType.NATIONAL,
      administrative_unit: 'Dhaka Division',
      constituency_scope: 'Dhaka-2',
      status: ElectionStatus.RESULTS_PUBLISHED,
      start_at: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
      end_at: new Date(now.getTime() - 36 * 60 * 60 * 1000), // Ended 1.5 days ago
      created_by: mainAdmin!.id,
    }
  });

  // 5. Create candidates
  console.log('👤 Registering Specific Candidates...');
  const candidateUsersData = [
    { name: 'Mahmud Hassan', email: 'mahmud@candidate.bd', role: Role.CANDIDATE, constituency: 'Dhaka-1', party: 'AL', manifesto: 'Digital transformation', occupation: 'Engineer', education: 'B.Sc.', election_id: activeElection.id, pwd: pwd1234 },
    { name: 'Aminul Islam', email: 'aminul@candidate.bd', role: Role.CANDIDATE, constituency: 'Dhaka-1', party: 'BNP', manifesto: 'Committed to infrastructure', occupation: 'Software Entrepreneur', education: 'B.Sc. in CSE', election_id: activeElection.id, pwd: pwd123 },
    { name: 'Salma Begum', email: 'salma@candidate.bd', role: Role.CANDIDATE, constituency: 'Dhaka-1', party: 'JP', manifesto: 'Standing for transparency', occupation: 'Social Worker', education: 'LL.B.', election_id: activeElection.id, pwd: pwd123 },
  ];

  const candidatesMap: Record<string, any> = {};

  for (const cData of candidateUsersData) {
    const existingCandUser = await prisma.user.findUnique({ where: { email: cData.email } });
    if (existingCandUser) {
      await prisma.candidate.deleteMany({ where: { user_id: existingCandUser.id } });
      await prisma.user.delete({ where: { id: existingCandUser.id } });
    }

    const u = await prisma.user.create({
      data: {
        name: cData.name,
        email: cData.email,
        phone: `+880170000010${Math.floor(Math.random() * 9)}`,
        nid_hash: crypto.createHash('sha256').update(cData.email).digest('hex'),
        password_hash: cData.pwd,
        role: Role.CANDIDATE,
        constituency: cData.constituency,
        is_verified: true,
      }
    });

    const party = partiesMap[cData.party];
    const candidate = await prisma.candidate.create({
      data: {
        user_id: u.id,
        election_id: cData.election_id,
        party_id: party.id,
        constituency: cData.constituency,
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        date_of_birth: new Date('1975-01-01'),
        education: cData.education,
        occupation: cData.occupation,
        manifesto: cData.manifesto,
        status: CandidateStatus.APPROVED,
        approved_at: new Date(),
      }
    });
    candidatesMap[cData.name] = candidate;
    console.log(`✅ Candidate created: ${cData.name} (${cData.email})`);
  }

  // 6. Create Specific Citizens
  console.log('👥 Seeding Specific Citizen/Voter accounts...');
  const citizenAccounts = [
    { name: 'Sheikh Talha Shahriar', email: 'talha@citizen.bd', pwd: pwd1234, constituency: 'Dhaka-1' },
    { name: 'Rashmin Ahmed Rasha', email: 'rasha@citizen.bd', pwd: pwd1234, constituency: 'Dhaka-1' },
    { name: 'Mehnaz Rahman', email: 'mehnaz@citizen.bd', pwd: pwd1234, constituency: 'Dhaka-2' },
    { name: 'Arifa Islam Sinthia', email: 'sinthia@citizen.bd', pwd: pwd1234, constituency: 'Dhaka-2' }
  ];

  const specificCitizens = [];
  for (const cit of citizenAccounts) {
    const existing = await prisma.user.findUnique({ where: { email: cit.email } });
    if (existing) {
      await prisma.voterElection.deleteMany({ where: { voter_id: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }
    const voter = await prisma.user.create({
      data: {
        name: cit.name,
        email: cit.email,
        phone: `+8801500000${Math.floor(Math.random() * 900)}`,
        nid_hash: crypto.createHash('sha256').update(`NID-${cit.email}`).digest('hex'),
        password_hash: cit.pwd,
        role: Role.VOTER,
        constituency: cit.constituency,
        is_verified: true,
      }
    });
    specificCitizens.push(voter);
    
    // Link to respective elections
    if (cit.constituency === 'Dhaka-1') {
      await prisma.voterElection.create({ data: { voter_id: voter.id, election_id: activeElection.id, has_voted: false } });
    } else {
      await prisma.voterElection.create({ data: { voter_id: voter.id, election_id: closedElection.id, has_voted: false } });
    }
    console.log(`✅ Citizen created: ${cit.name} (${cit.email})`);
  }

  // 7. Create 20 Batch Voters for Dhaka-1
  console.log('👥 Seeding 20 Batch Test Voters for Dhaka-1...');
  const batchVotersDhaka1 = [];
  for (let i = 1; i <= 20; i++) {
    const padded = String(i).padStart(2, '0');
    const email = `voter${padded}@test.bd`;

    const existingVoter = await prisma.user.findUnique({ where: { email } });
    if (existingVoter) {
      await prisma.voterElection.deleteMany({ where: { voter_id: existingVoter.id } });
      await prisma.user.delete({ where: { id: existingVoter.id } });
    }

    const voter = await prisma.user.create({
      data: {
        name: `Batch Test Voter ${padded}`,
        email: email,
        phone: `+88015111111${padded}`,
        nid_hash: crypto.createHash('sha256').update(`NID-BATCH-${padded}`).digest('hex'),
        password_hash: pwd123,
        role: Role.VOTER,
        constituency: 'Dhaka-1',
        is_verified: true,
      }
    });
    batchVotersDhaka1.push(voter);
    await prisma.voterElection.create({ data: { voter_id: voter.id, election_id: activeElection.id, has_voted: false } });
  }

  // 8. Cast Votes for Active Election (Dhaka-1) - using batch voters
  let prevHash = '0'.repeat(64);
  console.log('🗳️ Casting 15 cryptographically chained votes for Dhaka-1 from Batch Voters...');
  const activeTargets = [
    { candidate: candidatesMap['Mahmud Hassan'], count: 7 },
    { candidate: candidatesMap['Aminul Islam'], count: 5 },
    { candidate: candidatesMap['Salma Begum'], count: 3 }
  ];

  let voterIndex1 = 0;
  for (const group of activeTargets) {
    const cand = group.candidate;
    for (let c = 0; c < group.count; c++) {
      const voter = batchVotersDhaka1[voterIndex1++];
      const voteId = uuidv4();
      const castAt = new Date(now.getTime() - (50 - voterIndex1) * 60 * 1000);
      const voteHash = computeVoteHash(voteId, cand.id, activeElection.id, castAt.toISOString(), prevHash);

      await prisma.vote.create({ data: { id: voteId, election_id: activeElection.id, candidate_id: cand.id, constituency: 'Dhaka-1', cast_at: castAt, prev_hash: prevHash, vote_hash: voteHash } });
      await prisma.voteToken.create({ data: { token: uuidv4(), vote_id: voteId } });
      await prisma.voterElection.update({ where: { voter_id_election_id: { voter_id: voter.id, election_id: activeElection.id } }, data: { has_voted: true, voted_at: castAt } });
      prevHash = voteHash;
    }
  }

  console.log('🎉 Successfully seeded EXACT required demo data! Ready for demonstration!');
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Error seeding demo:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
