import { PrismaClient, Role, ElectionType, ElectionStatus, CandidateStatus, MaritalStatus, TaxPaymentStatus, LicenseCategory, LicenseStatus, VehicleType, VehicleStatus, PropertyType, PropertyTransferStatus, MahrType, MarriageStatus, DivorceType, DivorceStatus, FineStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const GENESIS_HASH = '0'.repeat(64);

function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  const keys = Object.keys(obj).sort();
  const sorted: any = {};
  for (const key of keys) {
    sorted[key] = sortKeys(obj[key]);
  }
  return sorted;
}

function deriveSectorKey(sector: string): string {
  const secret = process.env.LEDGER_HMAC_SECRET || 'bangladesh-e-gov-super-hmac-secret-key-salt-9876';
  return crypto.createHmac('sha256', sector).update(secret).digest('hex');
}

function computeRecordHash(record: { id: string; sector: string; payload: any; timestamp: Date; prevHash: string }): string {
  const sortedPayload = sortKeys(record.payload);
  const tsStr = record.timestamp.toISOString();
  const data = [
    record.id,
    record.sector,
    JSON.stringify(sortedPayload),
    tsStr,
    record.prevHash
  ].join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

function signRecord(record: any, recordHash: string): string {
  const key = deriveSectorKey(record.sector);
  return crypto.createHmac('sha256', key).update(recordHash).digest('hex');
}

async function appendToLedger(
  sector: 'VOTE' | 'TAX' | 'VEHICLE' | 'PROPERTY' | 'CIVIL_REGISTRY', 
  payload: any
) {
  const lastRecord = await prisma.ledgerRecord.findFirst({
    where: { sector },
    orderBy: { sequenceNumber: 'desc' }
  });

  const lastSeqNo = lastRecord ? lastRecord.sequenceNumber : 0;
  const currentSeqNo = lastSeqNo + 1;
  const prevHash = lastRecord ? lastRecord.recordHash : GENESIS_HASH;

  const id = crypto.randomUUID();
  const timestamp = new Date();

  const recordInput = {
    id,
    sector,
    payload,
    timestamp,
    prevHash
  };

  const recordHash = computeRecordHash(recordInput);
  const signature = signRecord(recordInput, recordHash);

  const newRecord = await prisma.ledgerRecord.create({
    data: {
      id,
      sector,
      sequenceNumber: currentSeqNo,
      payload,
      timestamp,
      prevHash,
      recordHash,
      signature
    }
  });

  return newRecord;
}

async function main() {
  console.log('🚀 Initiating clean, comprehensive database seeding with realistic BD context...');

  // 1. Safe cleanup
  console.log('🧹 Purging existing tables...');
  await prisma.voteToken.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.voterElection.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.election.deleteMany({});
  await prisma.party.deleteMany({});
  await prisma.anomalyFlag.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.trafficViolation.deleteMany({});
  await prisma.drivingLicense.deleteMany({});
  await prisma.vehicleTransfer.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.propertyTransfer.deleteMany({});
  await prisma.propertyDocument.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.divorceProceeding.deleteMany({});
  await prisma.marriageRecord.deleteMany({});
  await prisma.taxReturn.deleteMany({});
  await prisma.taxProfile.deleteMany({});
  await prisma.ledgerRecord.deleteMany({});
  await prisma.merkleBlock.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🔑 Hashing common password...');
  const passwordHash = await bcrypt.hash('Test@1234', 10);

  // 2. Seed Users
  console.log('👤 Seeding core user profiles...');
  const usersToCreate = [
    {
      name: "Arif Hossain",
      email: "arif@oneid.test",
      oneid: "BD-2026-ADMIN001",
      phone: "+8801711111101",
      nid_hash: "nid_hash_arif_hossain_1a2b3c",
      password_hash: passwordHash,
      role: Role.SUPER_ADMIN,
      constituency: "Dhaka-1",
      is_verified: true,
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Ramna",
      occupation: "Sovereign Administrator"
    },
    {
      name: "Nusrat Jahan",
      email: "nusrat@election.test",
      oneid: "BD-2026-ADMIN002",
      phone: "+8801711111102",
      nid_hash: "nid_hash_nusrat_jahan_2b3c4d",
      password_hash: passwordHash,
      role: Role.ADMIN,
      constituency: "Dhaka-1",
      is_verified: true,
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Ramna",
      occupation: "Election Commissioner"
    },
    {
      name: "Kamal Uddin",
      email: "kamal@nbr.test",
      oneid: "BD-2026-ADMIN003",
      phone: "+8801711111103",
      nid_hash: "nid_hash_kamal_uddin_3c4d5e",
      password_hash: passwordHash,
      role: Role.TAX_ADMIN,
      constituency: "Dhaka-1",
      is_verified: true,
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Gulshan",
      occupation: "NBR Commissioner"
    },
    {
      name: "Sabbir Rahman",
      email: "sabbir@brta.test",
      oneid: "BD-2026-ADMIN004",
      phone: "+8801711111104",
      nid_hash: "nid_hash_sabbir_rahman_4d5e6f",
      password_hash: passwordHash,
      role: Role.VEHICLE_ADMIN,
      constituency: "Dhaka-1",
      is_verified: true,
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Mirpur",
      occupation: "BRTA Inspector"
    },
    {
      name: "Fatema Khatun",
      email: "fatema@land.test",
      oneid: "BD-2026-ADMIN005",
      phone: "+8801711111105",
      nid_hash: "nid_hash_fatema_khatun_5e6f7g",
      password_hash: passwordHash,
      role: Role.PROPERTY_ADMIN,
      constituency: "Dhaka-1",
      is_verified: true,
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Uttara",
      occupation: "Ministry of Land Director"
    },
    {
      name: "Moulana Ibrahim",
      email: "ibrahim@kazi.test",
      oneid: "BD-2026-KAZI001",
      phone: "+8801711111106",
      nid_hash: "nid_hash_moulana_ibrahim_6f7g8h",
      password_hash: passwordHash,
      role: Role.KAZI_ADMIN,
      constituency: "Dhaka-1",
      is_verified: true,
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Sutrapur",
      occupation: "Sovereign Marriage Kazi"
    },
    {
      name: "Chairman Abdul Mannan",
      email: "mannan@dhaka-up.test",
      oneid: "BD-2026-CHAIR01",
      phone: "+8801711111107",
      nid_hash: "nid_hash_abdul_mannan_7g8h9i",
      password_hash: passwordHash,
      role: Role.LOCAL_AUTHORITY_ADMIN,
      constituency: "Dhaka-1",
      is_verified: true,
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Savar",
      occupation: "Union Parishad Chairman"
    },
    {
      name: "Sheikh Talha Shahriar",
      email: "talha@citizen.bd",
      oneid: "BD-2026-TLH001",
      phone: "+8801711111108",
      nid_hash: "nid_hash_sheikh_talha_8h9i0j",
      password_hash: passwordHash,
      role: Role.VOTER,
      constituency: "Dhaka-1",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Mirpur",
      maritalStatus: MaritalStatus.MARRIED,
      occupation: "Software Architect",
      is_verified: true
    },
    {
      name: "Rashmin Ahmed Rasha",
      email: "rasha@citizen.bd",
      oneid: "BD-2026-RSH001",
      phone: "+8801711111109",
      nid_hash: "nid_hash_rasha_9i0j1k",
      password_hash: passwordHash,
      role: Role.VOTER,
      constituency: "Dhaka-1",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Dhanmondi",
      maritalStatus: MaritalStatus.SINGLE,
      occupation: "Research Fellow",
      is_verified: true
    },
    {
      name: "Mehnaz Rahman",
      email: "mehnaz@citizen.bd",
      oneid: "BD-2026-MNZ001",
      phone: "+8801711111110",
      nid_hash: "nid_hash_mehnaz_0j1k2l",
      password_hash: passwordHash,
      role: Role.VOTER,
      constituency: "Dhaka-2",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Uttara",
      maritalStatus: MaritalStatus.DIVORCED,
      occupation: "Design Lead",
      is_verified: true
    },
    {
      name: "Arifa Islam Sinthia",
      email: "sinthia@citizen.bd",
      oneid: "BD-2026-SNT001",
      phone: "+8801711111111",
      nid_hash: "nid_hash_sinthia_1k2l3m",
      password_hash: passwordHash,
      role: Role.VOTER,
      constituency: "Dhaka-2",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Ramna",
      maritalStatus: MaritalStatus.SINGLE,
      occupation: "Data Analyst",
      is_verified: true
    },
    {
      name: "Mahmud Hassan",
      email: "mahmud@candidate.bd",
      oneid: "BD-2026-CND001",
      phone: "+8801711111112",
      nid_hash: "nid_hash_mahmud_2l3m4n",
      password_hash: passwordHash,
      role: Role.CANDIDATE,
      constituency: "Dhaka-1",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Mirpur",
      maritalStatus: MaritalStatus.MARRIED,
      occupation: "Philanthropist & Diplomat",
      is_verified: true
    },
    {
      name: "Sadia Islam",
      email: "sadia@citizen.bd",
      oneid: "BD-2026-SDI001",
      phone: "+8801711111113",
      nid_hash: "nid_hash_sadia_3m4n5o",
      password_hash: passwordHash,
      role: Role.VOTER,
      constituency: "Dhaka-1",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Mirpur",
      maritalStatus: MaritalStatus.MARRIED,
      occupation: "Education Coordinator",
      is_verified: true
    },
    {
      name: "Karim Islam",
      email: "karim@citizen.bd",
      oneid: "BD-2026-KRM001",
      phone: "+8801711111114",
      nid_hash: "nid_hash_karim_4n5o6p",
      password_hash: passwordHash,
      role: Role.VOTER,
      constituency: "Dhaka-2",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Uttara",
      maritalStatus: MaritalStatus.DIVORCED,
      occupation: "Senior Consultant",
      is_verified: true
    }
  ];

  const dbUsers: any[] = [];
  for (const userData of usersToCreate) {
    const user = await prisma.user.create({ data: userData });
    dbUsers.push(user);
  }
  console.log(`✓ Created ${dbUsers.length} secure core user accounts.`);

  // 3. Political Parties (Voters can interact with these)
  console.log('🚩 Seed political organizations...');
  const partiesData = [
    { name: 'Awami League', abbreviation: 'AL', symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Bangladesh_Awami_League_Logo.svg' },
    { name: 'Bangladesh Nationalist Party', abbreviation: 'BNP', symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Nationalist_Party_BP.svg' },
    { name: 'Jatiya Party', abbreviation: 'JP', symbol_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Jatiya_Party_logo.png' }
  ];

  const parties = [];
  for (const party of partiesData) {
    const createdParty = await prisma.party.create({ data: party });
    parties.push(createdParty);
  }

  // Seeding the default Active Election for constituency scope to enable Voting features
  const startAt = new Date();
  const endAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days out
  const defaultElection = await prisma.election.create({
    data: {
      title: 'Sovereign Jatiya Sangsad General Election 2026',
      description: 'Zero-knowledge cryptolink block voting demonstrating constituent ballot transparency in Dhaka division.',
      election_type: ElectionType.NATIONAL,
      administrative_unit: 'Dhaka Division',
      constituency_scope: 'Dhaka-1',
      status: ElectionStatus.ACTIVE,
      start_at: startAt,
      end_at: endAt,
      created_by: dbUsers[1].id // Nusrat Jahan
    }
  });

  // Register candidate Mahmud Hassan
  const candidateRecord = await prisma.candidate.create({
    data: {
      user_id: dbUsers[11].id, // Mahmud Hassan
      election_id: defaultElection.id,
      party_id: parties[0].id, // Awami League
      constituency: "Dhaka-1",
      photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      date_of_birth: new Date('1975-04-12'),
      education: "Master of Public Administration, Harvard",
      occupation: "Public Representative",
      manifesto: "Empowering digital governance transitions with zero-knowledge cryptographic authentication.",
      status: CandidateStatus.APPROVED,
      approved_at: new Date()
    }
  });

  // Pre-register citizen 8, 9, 12, 13 for election
  const votersForElection = [dbUsers[7], dbUsers[8], dbUsers[11], dbUsers[12]];
  for (const voter of votersForElection) {
    await prisma.voterElection.create({
      data: {
        voter_id: voter.id,
        election_id: defaultElection.id,
        has_voted: false
      }
    });
  }

  // 4. TAX MODULE DATA
  console.log('📰 Seeding tax records...');
  // Create profiles for Talha (User 8), Rasha (User 9), Mehnaz (User 10)
  const taxProfiles = [
    { citizenOneId: "BD-2026-TLH001", tin: "TIN-BD-9876543" },
    { citizenOneId: "BD-2026-RSH001", tin: "TIN-BD-1234567" },
    { citizenOneId: "BD-2026-MNZ001", tin: "TIN-BD-5555555" }
  ];

  const dbTaxProfiles: any[] = [];
  for (const profile of taxProfiles) {
    const p = await prisma.taxProfile.create({ data: profile });
    dbTaxProfiles.push(p);
  }

  // Create Returns for 2024
  const returnsData = [
    {
      taxProfileId: dbTaxProfiles[0].id, // Talha
      taxYear: 2024,
      grossIncome: 800000,
      taxableIncome: 450000,
      calculatedTax: 45000,
      minimumTax: 5000,
      finalTax: 45000,
      paymentStatus: TaxPaymentStatus.PAID,
      paidAmount: 45000,
      paidAt: new Date(),
      receiptNumber: "NBR-2024-REC-TLH01",
      anomalyFlag: false,
      anomalyReason: null
    },
    {
      taxProfileId: dbTaxProfiles[1].id, // Rasha
      taxYear: 2024,
      grossIncome: 450000,
      taxableIncome: 100000,
      calculatedTax: 5000,
      minimumTax: 5000,
      finalTax: 5000,
      paymentStatus: TaxPaymentStatus.UNPAID,
      paidAmount: 0,
      paidAt: null,
      receiptNumber: null,
      anomalyFlag: false,
      anomalyReason: null
    },
    {
      taxProfileId: dbTaxProfiles[2].id, // Mehnaz
      taxYear: 2024,
      grossIncome: 1200000,
      taxableIncome: 850000,
      calculatedTax: 120000,
      minimumTax: 5000,
      finalTax: 120000,
      paymentStatus: TaxPaymentStatus.PAID,
      paidAmount: 120000,
      paidAt: new Date(),
      receiptNumber: "NBR-2024-REC-MNZ01",
      anomalyFlag: true,
      anomalyReason: "High value transaction discrepancy with asset report"
    }
  ];

  const dbTaxReturns: any[] = [];
  for (const ret of returnsData) {
    const dbRet = await prisma.taxReturn.create({ data: ret });
    dbTaxReturns.push(dbRet);

    // Append to ledger for each Return
    const ledgerRec = await appendToLedger('TAX', {
      taxProfileId: ret.taxProfileId,
      taxYear: ret.taxYear,
      grossIncome: ret.grossIncome,
      finalTax: ret.finalTax,
      paymentStatus: ret.paymentStatus,
      anomalyFlag: ret.anomalyFlag
    });

    // Write Ledger ID back
    await prisma.taxReturn.update({
      where: { id: dbRet.id },
      data: { ledgerRecordId: ledgerRec.id }
    });
  }

  // 5. VEHICLE MODULE DATA
  console.log('🚗 Seeding vehicle and driving license records...');
  
  // Licenses: Talha (8) - APPROVED, Rasha (9) - APPROVED, Sinthia (11) - PENDING
  const licenseDataToSeed = [
    {
      licenseNumber: "BRTA-DL-7654321",
      citizenOneId: "BD-2026-TLH001",
      category: LicenseCategory.LIGHT_VEHICLE,
      status: LicenseStatus.APPROVED,
      issueDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 9 * 365 * 24 * 60 * 60 * 1000),
      bloodGroup: "B+",
      renewalCount: 0
    },
    {
      licenseNumber: "BRTA-DL-1234567",
      citizenOneId: "BD-2026-RSH001",
      category: LicenseCategory.MOTORCYCLE,
      status: LicenseStatus.APPROVED,
      issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 9 * 365 * 24 * 60 * 60 * 1000),
      bloodGroup: "O+",
      renewalCount: 0
    },
    {
      licenseNumber: "BRTA-DL-9999999",
      citizenOneId: "BD-2026-SNT001",
      category: LicenseCategory.MOTORCYCLE,
      status: LicenseStatus.PENDING,
      issueDate: null,
      expiryDate: null,
      bloodGroup: "A+",
      renewalCount: 0
    }
  ];

  const dbLicenses: any[] = [];
  for (const lData of licenseDataToSeed) {
    const dl = await prisma.drivingLicense.create({ data: lData });
    dbLicenses.push(dl);

    // Append driving license to Ledger
    const ledgerRec = await appendToLedger('VEHICLE', {
      licenseNumber: lData.licenseNumber,
      citizenOneId: lData.citizenOneId,
      category: lData.category,
      status: lData.status,
      bloodGroup: lData.bloodGroup
    });

    await prisma.drivingLicense.update({
      where: { id: dl.id },
      data: { ledgerRecordId: ledgerRec.id }
    });
  }

  // Vehicles: Talha owns Corolla, Rasha owns Honda Hornet
  const vehicleDataToSeed = [
    {
      registrationNo: "DHAKA-GA-KH-5678",
      type: VehicleType.CAR,
      make: "Toyota",
      model: "Corolla",
      year: 2022,
      color: "Silver",
      engineNo: "ENGINE-TY-10293",
      chassisNo: "CHASSIS-TY-98765",
      currentOwnerOneId: "BD-2026-TLH001",
      roadTaxDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: VehicleStatus.ACTIVE
    },
    {
      registrationNo: "DHAKA-GA-TA-1234",
      type: VehicleType.MOTORCYCLE,
      make: "Honda",
      model: "CB Hornet",
      year: 2023,
      color: "Black",
      engineNo: "ENGINE-HN-4455",
      chassisNo: "CHASSIS-HN-6677",
      currentOwnerOneId: "BD-2026-RSH001",
      roadTaxDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Within 14 days, triggers cron 3!
      status: VehicleStatus.ACTIVE
    }
  ];

  const dbVehicles: any[] = [];
  for (const vData of vehicleDataToSeed) {
    const v = await prisma.vehicle.create({ data: vData });
    dbVehicles.push(v);

    const ledgerRec = await appendToLedger('VEHICLE', {
      registrationNo: vData.registrationNo,
      type: vData.type,
      make: vData.make,
      model: vData.model,
      currentOwnerOneId: vData.currentOwnerOneId,
      status: vData.status
    });

    await prisma.vehicle.update({
      where: { id: v.id },
      data: { ledgerRecordId: ledgerRec.id }
    });
  }

  // Seeding 2 infractions (Traffic Violations) for Rashmin Ahmed Rasha (User 9)
  const violationsToSeed = [
    {
      licenseId: dbLicenses[1].id, // Rasha
      vehicleId: dbVehicles[1].id, // Honda Hornet
      violationType: "Speeding Under BRTA Safety Manual",
      fineAmount: 500,
      fineStatus: FineStatus.UNPAID,
      issuedByOneId: "BD-2026-ADMIN004"
    },
    {
      licenseId: dbLicenses[1].id, // Rasha
      vehicleId: dbVehicles[1].id, // Honda Hornet
      violationType: "Hazardous Signal Jump",
      fineAmount: 300,
      fineStatus: FineStatus.UNPAID,
      issuedByOneId: "BD-2026-ADMIN004"
    }
  ];

  for (const viol of violationsToSeed) {
    const dbViol = await prisma.trafficViolation.create({ data: viol });
    const ledgerRec = await appendToLedger('VEHICLE', {
      violationId: dbViol.id,
      licenseNumber: dbLicenses[1].licenseNumber,
      violationType: viol.violationType,
      fineAmount: viol.fineAmount,
      fineStatus: viol.fineStatus
    });

    await prisma.trafficViolation.update({
      where: { id: dbViol.id },
      data: { ledgerRecordId: ledgerRec.id }
    });
  }

  // 6. PROPERTY MODULE DATA
  console.log('🏡 Seeding property title registry and historical transactions...');
  
  // Properties: Talha owns Mirpur apt, Mehnaz owns Uttara Plot
  const propertiesToSeed = [
    {
      propertyId: "PROP-BD-MIRPUR-001",
      title: "Mirpur Penthouse",
      address: "Apartment 4B, Mirpur-10, Dhaka",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Mirpur",
      mouza: "Mirpur Mouza",
      khatianNumber: "K-12048",
      plotNumber: "P-5432",
      areaInDecimal: 3.5,
      type: PropertyType.RESIDENTIAL,
      currentOwnerOneId: "BD-2026-TLH001",
      estimatedValueBDT: 8500000
    },
    {
      propertyId: "PROP-BD-UTTARA-002",
      title: "Uttara Premium Plot",
      address: "Plot 15, Uttara Sector 7",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Uttara",
      mouza: "Uttara Mouza",
      khatianNumber: "K-9876",
      plotNumber: "Plot-15",
      areaInDecimal: 5.0,
      type: PropertyType.RESIDENTIAL,
      currentOwnerOneId: "BD-2026-MNZ001",
      estimatedValueBDT: 15000000
    }
  ];

  const dbProperties: any[] = [];
  for (const prop of propertiesToSeed) {
    const p = await prisma.property.create({ data: prop });
    dbProperties.push(p);

    const ledgerRec = await appendToLedger('PROPERTY', {
      propertyId: prop.propertyId,
      title: prop.title,
      areaInDecimal: prop.areaInDecimal,
      currentOwnerOneId: prop.currentOwnerOneId,
      estimatedValueBDT: prop.estimatedValueBDT
    });

    await prisma.property.update({
      where: { id: p.id },
      data: { ledgerRecordId: ledgerRec.id }
    });
  }

  // 1 Completed historical PropertyTransfer (Mehnaz (citizen 10) -> Talha (citizen 8) for the Mirpur Apartment)
  const transferData = {
    propertyId: dbProperties[0].id, // Mirpur Apartment
    fromOwnerOneId: "BD-2026-MNZ001", // Mehnaz
    toOwnerOneId: "BD-2026-TLH001", // Talha
    agreedPriceBDT: 8500000,
    sellerSignatureHash: "SIG-SELLER-1029384",
    buyerSignatureHash: "SIG-BUYER-8765432",
    sellerSignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    buyerSignedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    adminApprovedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    adminOneId: "BD-2026-ADMIN005",
    status: PropertyTransferStatus.COMPLETED,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  };

  const dbTransfer = await prisma.propertyTransfer.create({ data: transferData });

  const transferLedgerRec = await appendToLedger('PROPERTY', {
    transferId: dbTransfer.id,
    propertyId: "PROP-BD-MIRPUR-001",
    fromOwnerOneId: transferData.fromOwnerOneId,
    toOwnerOneId: transferData.toOwnerOneId,
    agreedPriceBDT: transferData.agreedPriceBDT,
    status: transferData.status
  });

  await prisma.propertyTransfer.update({
    where: { id: dbTransfer.id },
    data: { ledgerRecordId: transferLedgerRec.id }
  });

  // 7. CIVIL REGISTRY MODULE DATA
  console.log('👰 Seeding civil marriages and dissolution documents...');
  
  // Marriage: Talha (8) and Sadia (13). Kazi Moulana Ibrahim (BD-2026-KAZI001). Status ACTIVE.
  const activeMarriage = {
    marriageId: "NIKA-2026-0987654",
    groomOneId: "BD-2026-TLH001",
    brideOneId: "BD-2026-SDI001",
    kaziOneId: "BD-2026-KAZI001",
    witness1OneId: "BD-2026-RSH001",
    witness2OneId: "BD-2026-SNT001",
    mahrAmountBDT: 500000,
    mahrType: MahrType.PROMPT,
    registrationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    nikahnaamaHash: "0xec4d2ee019e1e360cbdfd5d4d12f91fa870c9103e6bc4be4df3df99f8e02581c",
    status: MarriageStatus.ACTIVE
  };

  const dbActiveMarriage = await prisma.marriageRecord.create({ data: activeMarriage });
  
  const m1Ledger = await appendToLedger('CIVIL_REGISTRY', {
    marriageId: activeMarriage.marriageId,
    groomOneId: activeMarriage.groomOneId,
    brideOneId: activeMarriage.brideOneId,
    kaziOneId: activeMarriage.kaziOneId,
    mahrAmountBDT: activeMarriage.mahrAmountBDT,
    nikahnaamaHash: activeMarriage.nikahnaamaHash,
    status: activeMarriage.status
  });

  await prisma.marriageRecord.update({
    where: { id: dbActiveMarriage.id },
    data: { ledgerRecordId: m1Ledger.id }
  });

  // Dissolved Marriage: Mehnaz (10) and Karim (14). status DISSOLVED, proceedings status FINALIZED.
  const dissolvedMarriage = {
    marriageId: "NIKA-HISTORICAL-4455",
    groomOneId: "BD-2026-KRM001",
    brideOneId: "BD-2026-MNZ001",
    kaziOneId: "BD-2026-KAZI001",
    witness1OneId: "BD-2026-RSH001",
    witness2OneId: "BD-2026-SNT001",
    mahrAmountBDT: 400000,
    mahrType: MahrType.DEFERRED,
    registrationDate: new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000),
    nikahnaamaHash: "0xee6c1cbbf78923a101f3e7bb5ee0258f192b950ad97ae1ec1c1e9581c2049e4d5",
    status: MarriageStatus.DISSOLVED
  };

  const dbDissolvedMarriage = await prisma.marriageRecord.create({ data: dissolvedMarriage });

  const m2Ledger = await appendToLedger('CIVIL_REGISTRY', {
    marriageId: dissolvedMarriage.marriageId,
    groomOneId: dissolvedMarriage.groomOneId,
    brideOneId: dissolvedMarriage.brideOneId,
    kaziOneId: dissolvedMarriage.kaziOneId,
    nikahnaamaHash: dissolvedMarriage.nikahnaamaHash,
    status: dissolvedMarriage.status
  });

  await prisma.marriageRecord.update({
    where: { id: dbDissolvedMarriage.id },
    data: { ledgerRecordId: m2Ledger.id }
  });

  // Associated completed Divorce Proceeding
  const divorceProceedingData = {
    marriageId: dbDissolvedMarriage.id,
    initiatorOneId: "BD-2026-KRM001",
    divorceType: DivorceType.TALAQ,
    noticeFiledAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    arbitrationFormedAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
    chairmanOneId: "BD-2026-CHAIR01",
    reconciliationAttempts: 3,
    effectiveDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    actualEffectiveDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    status: DivorceStatus.FINALIZED,
    certificateHash: "0xd9cf320f8ee98ad1a3ff0cb72aa68ff74bf4f5fb2ff0cd82a17cb6e84ed0259f"
  };

  const dbDivProceeding = await prisma.divorceProceeding.create({ data: divorceProceedingData });

  const divLedger = await appendToLedger('CIVIL_REGISTRY', {
    divorceId: dbDivProceeding.id,
    marriageId: dissolvedMarriage.marriageId,
    initiatorOneId: divorceProceedingData.initiatorOneId,
    status: divorceProceedingData.status,
    certificateHash: divorceProceedingData.certificateHash
  });

  await prisma.divorceProceeding.update({
    where: { id: dbDivProceeding.id },
    data: { ledgerRecordId: divLedger.id }
  });

  // Total Seeding Audit Verification Outputs
  const usersCount = await prisma.user.count();
  const taxCount = await prisma.taxReturn.count();
  const vehiclesCount = await prisma.vehicle.count();
  const propertiesCount = await prisma.property.count();
  const marriageCount = await prisma.marriageRecord.count();
  const ledgerCount = await prisma.ledgerRecord.count();

  console.log(`✓ Seeded ${usersCount} users, ${taxCount} tax records, ${vehiclesCount} vehicles, ${propertiesCount} properties, ${marriageCount} marriage records, ${ledgerCount} ledger records`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ E-Gov Seeding exception failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
