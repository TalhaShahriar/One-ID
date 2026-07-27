import { PrismaClient, Role, ElectionType, ElectionStatus, CandidateStatus, FlagType, Severity } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function computeVoteHash(voteId: string, candidateId: number, electionId: number, timestamp: string, prevHash: string): string {
  const data = [voteId, candidateId, electionId, timestamp, prevHash].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function main() {
  console.log('🚀 Initiating VoteChain BD Rich Presentation Demo Seeder...');

  // 1. Resolve Admin or seed if not exists
  let admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN }
  });

  if (!admin) {
    console.log('👤 Seeding default Admin because none exists...');
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@votechain.bd',
        phone: '+8801700000001',
        nid_hash: crypto.createHash('sha256').update('1111111111111').digest('hex'),
        password_hash: adminPasswordHash,
        role: Role.ADMIN,
        constituency: 'Dhaka-1',
        is_verified: true,
      }
    });
    console.log(`✅ Admin created: ${admin.email}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${admin.email}`);
  }

  // 2. Resolve Parties or seed if not exist
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

  const partiesMap: Record<string, any> = {};
  for (const party of partiesData) {
    let existingParty = await prisma.party.findFirst({
      where: { abbreviation: party.abbreviation }
    });
    if (!existingParty) {
      existingParty = await prisma.party.create({ data: party });
      console.log(`✅ Party created: ${existingParty.name} (${existingParty.abbreviation})`);
    } else {
      console.log(`ℹ️ Party already exists: ${existingParty.name}`);
    }
    partiesMap[party.abbreviation] = existingParty;
  }

  // 3. Clear old demo elections & cascade dependencies to avoid conflicts
  console.log('🧹 Formatting pre-existing Demo Election records for a clean slate...');
  const existingDemoElections = await prisma.election.findMany({
    where: { title: "Dhaka-1 Constituency By-Election Demo" }
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

  // 4. Create Demo Election
  const now = new Date();
  const startAt = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
  const endAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);   // 2 hours from now

  console.log('🗳️ Creating Dhaka-1 Constituency By-Election Demo...');
  const election = await prisma.election.create({
    data: {
      title: 'Dhaka-1 Constituency By-Election Demo',
      description: 'An active localized model representation of the VoteChain BD cryptographic ledger system with real-time audit logs.',
      election_type: ElectionType.NATIONAL,
      administrative_unit: 'Dhaka Division',
      constituency_scope: 'Dhaka-1',
      status: ElectionStatus.ACTIVE,
      start_at: startAt,
      end_at: endAt,
      created_by: admin.id,
    }
  });
  console.log(`✅ Demo Election configured with ID: ${election.id}`);

  // 5. Create 5 candidate accounts and associate APPROVED candidate profiles
  console.log('👤 Registering and approving Demo Candidates...');
  const candidateUsersData = [
    {
      name: 'Aminul Islam',
      email: 'aminul@candidate.bd',
      phone: '+8801700000101',
      nid_hash: crypto.createHash('sha256').update('2222222222222').digest('hex'),
      role: Role.CANDIDATE,
      constituency: 'Dhaka-1',
      party: 'AL',
      manifesto: 'Committed to digital infrastructure and youth employment in Dhaka-1',
      occupation: 'Software Entrepreneur',
      education: 'B.Sc. in CSE, BUET',
    },
    {
      name: 'Salma Begum',
      email: 'salma@candidate.bd',
      phone: '+8801700000102',
      nid_hash: crypto.createHash('sha256').update('3333333333333').digest('hex'),
      role: Role.CANDIDATE,
      constituency: 'Dhaka-1',
      party: 'BNP',
      manifesto: 'Standing for transparency, healthcare, and women\'s rights',
      occupation: 'Social Worker & Advocate',
      education: 'LL.B., University of Dhaka',
    },
    {
      name: 'Rashid Khan',
      email: 'rashid@candidate.bd',
      phone: '+8801700000103',
      nid_hash: crypto.createHash('sha256').update('4444444444444').digest('hex'),
      role: Role.CANDIDATE,
      constituency: 'Dhaka-1',
      party: 'JP',
      manifesto: 'Focused on local development, clean water, and education',
      occupation: 'Retired Principal',
      education: 'M.A. in History',
    },
    {
      name: 'Nusrat Ahmed',
      email: 'nusrat@candidate.bd',
      phone: '+8801700000104',
      nid_hash: crypto.createHash('sha256').update('5555555555555').digest('hex'),
      role: Role.CANDIDATE,
      constituency: 'Dhaka-2', // Second constituency for testing
      party: 'AL',
      manifesto: 'Focusing on sanitation and structural development in Dhaka-2',
      occupation: 'Civil Engineer',
      education: 'M.Sc. in Structural Engineering',
    },
    {
      name: 'Kabir Hossain',
      email: 'kabir@candidate.bd',
      phone: '+8801700000105',
      nid_hash: crypto.createHash('sha256').update('6666666666666').digest('hex'),
      role: Role.CANDIDATE,
      constituency: 'Dhaka-2', // Second constituency for testing
      party: 'BNP',
      manifesto: 'Lobbying for commercial growth and market system reforms in Dhaka-2',
      occupation: 'Businessman',
      education: 'MBA, IBA',
    }
  ];

  const candHash = await bcrypt.hash('Test@123', 10);
  const candidatesMap: Record<string, any> = {};

  for (const cData of candidateUsersData) {
    // Delete existing user if email matches to prevent unique issues
    const existingCandUser = await prisma.user.findUnique({ where: { email: cData.email } });
    if (existingCandUser) {
      await prisma.candidate.deleteMany({ where: { user_id: existingCandUser.id } });
      await prisma.user.delete({ where: { id: existingCandUser.id } });
    }

    const u = await prisma.user.create({
      data: {
        name: cData.name,
        email: cData.email,
        phone: cData.phone,
        nid_hash: cData.nid_hash,
        password_hash: candHash,
        role: Role.CANDIDATE,
        constituency: cData.constituency,
        is_verified: true,
      }
    });

    const party = partiesMap[cData.party];
    const candidate = await prisma.candidate.create({
      data: {
        user_id: u.id,
        election_id: election.id,
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
    console.log(`✅ Candidate approved: ${u.name} representing ${cData.party} in ${cData.constituency}`);
    candidatesMap[cData.name] = candidate;
  }

  // 6. Create 20 verified voter accounts: voter01@test.bd through voter20@test.bd under constituency Dhaka-1
  console.log('👥 Seeding 20 test voter accounts in Dhaka-1 constituency...');
  const voterHash = await bcrypt.hash('Test@123', 10);
  const voters = [];
  
  for (let i = 1; i <= 20; i++) {
    const padded = String(i).padStart(2, '0');
    const email = `voter${padded}@test.bd`;

    // Clean old voter record with same email
    const existingVoter = await prisma.user.findUnique({ where: { email } });
    if (existingVoter) {
      await prisma.voterElection.deleteMany({ where: { voter_id: existingVoter.id } });
      await prisma.anomalyFlag.deleteMany({ where: { voter_id: existingVoter.id } });
      await prisma.user.delete({ where: { id: existingVoter.id } });
    }

    const voter = await prisma.user.create({
      data: {
        name: `Constituent Voter ${padded}`,
        email: email,
        phone: `+88015000000${padded}`,
        nid_hash: crypto.createHash('sha256').update(`NID-${padded}-HASH`).digest('hex'),
        password_hash: voterHash,
        role: Role.VOTER,
        constituency: 'Dhaka-1',
        is_verified: true,
      }
    });
    voters.push(voter);

    // Seed VoterElection linkage
    await prisma.voterElection.create({
      data: {
        voter_id: voter.id,
        election_id: election.id,
        has_voted: false,
      }
    });
  }
  console.log(`✅ Created 20 verified voter profiles and initialized voter_elections relationship.`);

  // 7. Pre-cast 15 votes spread across the 3 candidates (7 Aminul, 5 Salma, 3 Rashid)
  // Compute and link hash chain properly using computeVoteHash()
  console.log('🗳️ Casting 15 cryptographically chained votes securely...');
  
  const targetCandidates = [
    { candidate: candidatesMap['Aminul Islam'], count: 7 },
    { candidate: candidatesMap['Salma Begum'], count: 5 },
    { candidate: candidatesMap['Rashid Khan'], count: 3 }
  ];

  // Map voters to precast
  let voterIndex = 0;
  let prevHash = '0'.repeat(64); // Chain Genesis Block Prev Hash

  for (const group of targetCandidates) {
    const cand = group.candidate;
    for (let c = 0; c < group.count; c++) {
      const voter = voters[voterIndex];
      voterIndex++;

      const voteId = uuidv4();
      const castAt = new Date(now.getTime() - (50 - voterIndex) * 60 * 1000); // realistic time ordering
      const castAtStr = castAt.toISOString();

      const voteHash = computeVoteHash(voteId, cand.id, election.id, castAtStr, prevHash);

      // Create vote record
      await prisma.vote.create({
        data: {
          id: voteId,
          election_id: election.id,
          candidate_id: cand.id,
          constituency: 'Dhaka-1',
          cast_at: castAt,
          prev_hash: prevHash,
          vote_hash: voteHash,
        }
      });

      // Create corresponding VoteToken record
      const token = uuidv4();
      await prisma.voteToken.create({
        data: {
          token: token,
          vote_id: voteId,
        }
      });

      // Update VoterElection
      await prisma.voterElection.update({
        where: {
          voter_id_election_id: {
            voter_id: voter.id,
            election_id: election.id
          }
        },
        data: {
          has_voted: true,
          voted_at: castAt,
        }
      });

      // Advance chain hash representation
      prevHash = voteHash;
    }
  }
  console.log(`✅ Cast 15 votes. Blockchain ledger state is completely VALID & chained!`);

  // 8. Create 2 anomaly flags for presentation
  console.log('🚨 Injecting live anomaly flags for real-time presentation auditing...');
  
  // 1 IP_RATE_SPIKE
  await prisma.anomalyFlag.create({
    data: {
      flag_type: FlagType.IP_RATE_SPIKE,
      ip_address: '103.230.104.22',
      voter_id: voters[15].id, // Voter 16
      election_id: election.id,
      severity: Severity.HIGH,
      details: {
        message: 'Suspiciously high request rate detected from an isolated IP address range.',
        requestCount: 37,
        timeframeSeconds: 10,
        subscribersTriggered: ['voter16@test.bd', 'voter17@test.bd']
      },
      is_reviewed: false,
    }
  });

  // 1 DEVICE_COLLISION
  await prisma.anomalyFlag.create({
    data: {
      flag_type: FlagType.DEVICE_COLLISION,
      ip_address: '192.168.43.100',
      voter_id: voters[18].id, // Voter 19
      election_id: election.id,
      severity: Severity.HIGH,
      details: {
        message: 'Multiple distinct Voter NID submissions performed using matching hardware signatures.',
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 6 Build/TP1A.220624.021)',
        deviceFingerprint: 'accb0ea12eef45db4721',
        distinctVoterIDs: [voters[18].id, voters[19].id]
      },
      is_reviewed: false,
    }
  });

  console.log('🎉 Successfully seeded rich demo data! The system is 100% ready for presentation!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding demo:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
