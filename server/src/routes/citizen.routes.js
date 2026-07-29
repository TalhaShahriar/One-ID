import { Router } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../prisma.js';
import { authenticateJWT } from '../core/auth.middleware.js';
import { logEvent } from '../core/audit.service.js';

const router = Router();

/**
 * GET /api/citizen/summary
 * Primary optimized aggregator of stats across all 5 e-governance panels.
 * Avoids any secondary client-side API waterfall delays.
 */
router.get('/summary', authenticateJWT, async (req, res, next) => {
  try {
    const userId = parseInt(req.user.userId || req.user.id, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found in database.' });
    }

    const { oneid } = user;

    // 1. Voting summary panel matching Election model
    const voterConstituency = user.constituency;
    const electionFilter = {
      status: 'ACTIVE',
      OR: [
        { constituency_scope: voterConstituency },
        { constituency_scope: { contains: voterConstituency, mode: 'insensitive' } },
        { constituency_scope: 'ALL' },
        { constituency_scope: 'NATIONAL' }
      ]
    };

    const activeElectionsCount = await prisma.election.count({
      where: electionFilter
    });
    
    // Find active elections and check if user voted in any of them
    const activeElections_instances = await prisma.election.findMany({
      where: electionFilter,
      select: { id: true }
    });
    const activeElectionIds = activeElections_instances.map(e => e.id);
    let hasVoted = false;
    if (activeElectionIds.length > 0) {
      const checkCast = await prisma.voterElection.count({
        where: {
          voter_id: userId,
          election_id: { in: activeElectionIds },
          has_voted: true
        }
      });
      hasVoted = checkCast > 0;
    }

    // 2. Tax summary matching TaxProfile & TaxReturn
    let currentYearFiled = false;
    let totalUnpaid = 0.0;
    if (oneid) {
      const taxProfile = await prisma.taxProfile.findUnique({
        where: { citizenOneId: oneid },
        include: { returns: true }
      });
      if (taxProfile && taxProfile.returns) {
        const currentYear = new Date().getFullYear();
        currentYearFiled = taxProfile.returns.some(r => r.taxYear === currentYear || r.taxYear === currentYear - 1);
        const unpaidList = taxProfile.returns.filter(r => r.paymentStatus === 'UNPAID' || r.paymentStatus === 'PARTIAL');
        totalUnpaid = unpaidList.reduce((sum, r) => {
          const finalTax = r.finalTax || 0;
          const paidAmount = r.paidAmount || 0;
          return sum + (finalTax - paidAmount);
        }, 0);
      }
    }

    // 3. Vehicles summary matching Vehicle & Transfers
    let ownedVehiclesCount = 0;
    let pendingTransfersCount = 0;
    if (oneid) {
      ownedVehiclesCount = await prisma.vehicle.count({
        where: { currentOwnerOneId: oneid, status: { not: 'SCRAPPED' } }
      });
      pendingTransfersCount = await prisma.vehicleTransfer.count({
        where: {
          OR: [
            { fromOwnerOneId: oneid },
            { toOwnerOneId: oneid }
          ],
          status: { in: ['PENDING_SELLER_SIGN', 'PENDING_BUYER_SIGN', 'PENDING_ADMIN'] }
        }
      });
    }

    // 4. Land Cabinet matching Property & Transfers
    let ownedPropertiesCount = 0;
    let pendingPropTransfersCount = 0;
    if (oneid) {
      ownedPropertiesCount = await prisma.property.count({
        where: { currentOwnerOneId: oneid }
      });
      pendingPropTransfersCount = await prisma.propertyTransfer.count({
        where: {
          OR: [
            { fromOwnerOneId: oneid },
            { toOwnerOneId: oneid }
          ],
          status: { in: ['INITIATED', 'PENDING_SELLER_SIGN', 'PENDING_BUYER_SIGN', 'PENDING_ADMIN_APPROVAL', 'DISPUTED'] }
        }
      });
    }

    // 5. Digital Nikahnama civil summary
    let maritalStatus = user.maritalStatus || 'SINGLE';
    let divorceProceeding = null;
    if (oneid) {
      const activeProceeding = await prisma.divorceProceeding.findFirst({
        where: {
          marriage: {
            OR: [
              { groomOneId: oneid },
              { brideOneId: oneid }
            ]
          },
          status: { in: ['NOTICE_FILED', 'ARBITRATION_ACTIVE'] }
        },
        include: {
          marriage: true
        }
      });
      if (activeProceeding) {
        divorceProceeding = {
          id: activeProceeding.id,
          initiatorOneId: activeProceeding.initiatorOneId,
          divorceType: activeProceeding.divorceType,
          status: activeProceeding.status,
          effectiveDate: activeProceeding.effectiveDate,
          reconciliationAttempts: activeProceeding.reconciliationAttempts
        };
      }
    }

    return res.json({
      voting: {
        activeElections: activeElectionsCount,
        hasVoted
      },
      tax: {
        currentYearFiled,
        totalUnpaid
      },
      vehicles: {
        owned: ownedVehiclesCount,
        pendingTransfers: pendingTransfersCount
      },
      property: {
        owned: ownedPropertiesCount,
        pendingTransfers: pendingPropTransfersCount
      },
      civil: {
        maritalStatus,
        activeDivorceProceeding: divorceProceeding
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/citizen/activity
 * Pulls the last 20 immutable security Audit Logs associated with the citizen.
 */
router.get('/activity', authenticateJWT, async (req, res, next) => {
  try {
    const userId = parseInt(req.user.userId || req.user.id, 10);
    const logs = await prisma.auditLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    const parsedActivities = logs.map(log => {
      let module = 'Identity';
      let et = log.event_type.toUpperCase();

      if (et.startsWith('VOTE') || et.startsWith('ELECTION') || et.startsWith('BALLOT') || et.includes('VOTER')) {
        module = 'Voting';
      } else if (et.startsWith('TAX') || et.startsWith('RETURN') || et.startsWith('TIN')) {
        module = 'Tax';
      } else if (et.startsWith('VEHICLE') || et.startsWith('LICENSE') || et.startsWith('VIOLATION') || et.startsWith('DRIVING')) {
        module = 'Vehicles';
      } else if (et.startsWith('PROPERTY') || et.startsWith('LAND') || et.startsWith('DEED') || et.startsWith('KATHIAN')) {
        module = 'Property';
      } else if (et.startsWith('CIVIL') || et.startsWith('MARRIAGE') || et.startsWith('DIVORCE') || et.startsWith('NIKAH') || et.startsWith('TALAQ')) {
        module = 'Civil';
      }

      // Automatically search for ledger UUID pattern in description
      let ledgerRecordId = null;
      const uuidMatch = log.description.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
      if (uuidMatch) {
        ledgerRecordId = uuidMatch[0];
      }

      return {
        id: log.id,
        module,
        event_type: log.event_type,
        action: log.description,
        timestamp: log.created_at,
        ledgerRecordId
      };
    });

    return res.json(parsedActivities);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/citizen/notifications
 * Returns events targeted at the authenticated voter, organized newest first.
 */
router.get('/notifications', authenticateJWT, async (req, res, next) => {
  try {
    const userId = parseInt(req.user.userId || req.user.id, 10);
    const logs = await prisma.auditLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 40
    });

    const notifications = logs.map(log => {
      let module = 'Identity';
      let et = log.event_type.toUpperCase();

      if (et.startsWith('VOTE') || et.startsWith('ELECTION') || et.startsWith('BALLOT') || et.includes('VOTER')) {
        module = 'Voting';
      } else if (et.startsWith('TAX') || et.startsWith('RETURN') || et.startsWith('TIN')) {
        module = 'Tax';
      } else if (et.startsWith('VEHICLE') || et.startsWith('LICENSE') || et.startsWith('VIOLATION') || et.startsWith('DRIVING')) {
        module = 'Vehicles';
      } else if (et.startsWith('PROPERTY') || et.startsWith('LAND') || et.startsWith('DEED')) {
        module = 'Property';
      } else if (et.startsWith('CIVIL') || et.startsWith('MARRIAGE') || et.startsWith('DIVORCE') || et.startsWith('NIKAH') || et.startsWith('TALAQ')) {
        module = 'Civil';
      }

      let ledgerRecordId = null;
      const uuidMatch = log.description.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
      if (uuidMatch) {
         ledgerRecordId = uuidMatch[0];
      }

      return {
        id: log.id,
        module,
        event_type: log.event_type,
        message: log.description,
        timestamp: log.created_at,
        ledgerRecordId
      };
    });

    return res.json(notifications);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/citizen/oneid-qr
 * Generates a high-quality QR validation PNG buffer for the user's authentic OneID key.
 */
router.get('/oneid-qr', authenticateJWT, async (req, res, next) => {
  try {
    const userId = parseInt(req.user.userId || req.user.id, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.oneid) {
       return res.status(404).json({ error: 'Genuine OneID identity not assigned to this user profile yet.' });
    }

    // Build the QR containing the explicit OneID key
    const qrBuffer = await QRCode.toBuffer(user.oneid, { 
      type: 'png',
      margin: 1.5,
      width: 320,
      color: {
        dark: '#006a4e', // Bangladesh dark green
        light: '#ffffff'
      }
    });

    res.setHeader('Content-Type', 'image/png');
    return res.send(qrBuffer);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/citizen/profile
 * Allows voters / candidates to update customizable details safely.
 */
router.patch('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const userId = parseInt(req.user.userId || req.user.id, 10);
    const { 
      name, 
      phone, 
      division, 
      district, 
      upazila, 
      occupation, 
      dateOfBirth, 
      bloodGroup 
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const updateMap = {};
    if (name) updateMap.name = name;
    if (phone) updateMap.phone = phone;
    if (division) updateMap.division = division;
    if (district) updateMap.district = district;
    if (upazila) updateMap.upazila = upazila;
    if (occupation) updateMap.occupation = occupation;
    if (dateOfBirth) updateMap.dateOfBirth = new Date(dateOfBirth);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateMap
    });

    // Update Driving License blood group link if available
    if (bloodGroup && user.oneid) {
      const existingLicense = await prisma.drivingLicense.findFirst({
        where: { citizenOneId: user.oneid }
      });
      if (existingLicense) {
        await prisma.drivingLicense.update({
          where: { id: existingLicense.id },
          data: { bloodGroup }
        });
      }
    }

    // Log the security profile update event
    await logEvent(
      userId, 
      'IDENTITY_PROFILE_UPDATED', 
      `Citizen updated details: name=${name || user.name}, phone=${phone || user.phone}`, 
      req.ip
    );

    return res.json({ 
      message: 'Citizen profile adjusted successfully.', 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        constituency: updatedUser.constituency,
        oneid: updatedUser.oneid,
        maritalStatus: updatedUser.maritalStatus,
        division: updatedUser.division,
        district: updatedUser.district,
        upazila: updatedUser.upazila,
        dateOfBirth: updatedUser.dateOfBirth,
        occupation: updatedUser.occupation
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/citizen/public-verify-identity/:oneid
 * Public, secure query of real-time legal/standing credentials for physical verifiers.
 */
router.get('/public-verify-identity/:oneid', async (req, res, next) => {
  try {
    const { oneid } = req.params;

    const user = await prisma.user.findUnique({
      where: { oneid },
      include: {
        drivingLicense: true,
        tax_profile: {
          include: {
            returns: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'No citizen found matching this OneID identifier in Bangladesh Central Directory.' });
    }

    // Compute Voting Summary
    const activeElections_instances = await prisma.election.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });
    const activeElectionIds = activeElections_instances.map(e => e.id);
    let hasVoted = false;
    if (activeElectionIds.length > 0) {
      const checkCast = await prisma.voterElection.count({
        where: {
          voter_id: user.id,
          election_id: { in: activeElectionIds },
          has_voted: true
        }
      });
      hasVoted = checkCast > 0;
    }

    // Compute Tax Summary
    let taxFiled = false;
    let taxArrears = 0;
    let totalTaxPaid = 0;
    let lastTaxReturnYear = null;
    let tinNumber = user.tax_profile?.tin || null;

    if (user.tax_profile && user.tax_profile.returns) {
      taxFiled = user.tax_profile.returns.length > 0;
      const sortedReturns = [...user.tax_profile.returns].sort((a, b) => b.taxYear - a.taxYear);
      if (sortedReturns.length > 0) {
        lastTaxReturnYear = sortedReturns[0].taxYear;
      }

      const unpaidList = user.tax_profile.returns.filter(r => r.paymentStatus === 'UNPAID' || r.paymentStatus === 'PARTIAL');
      taxArrears = unpaidList.reduce((sum, r) => sum + ((r.finalTax || 0) - (r.paidAmount || 0)), 0);
      totalTaxPaid = user.tax_profile.returns.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    }

    // Compute Vehicles
    const ownedVehiclesCount = await prisma.vehicle.count({
      where: { currentOwnerOneId: oneid, status: 'ACTIVE' }
    });

    // Compute Properties
    const ownedPropertiesCount = await prisma.property.count({
      where: { currentOwnerOneId: oneid }
    });

    // Calculate age safely
    let age = null;
    let isAdult = false;
    if (user.dateOfBirth) {
      const birthDate = new Date(user.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      isAdult = age >= 18;
    } else {
      // Default to adult if user role is VOTER or age unknown
      isAdult = true;
      age = 25;
    }

    const isVoterEligible = isAdult && user.role !== 'SUSPENDED';
    const taxPaymentStatus = (taxFiled && taxArrears === 0) ? 'PAID' : (taxArrears > 0 ? 'UNPAID_ARREARS' : (taxFiled ? 'PARTIAL' : 'NOT_FILED'));

    return res.json({
      name: user.name,
      oneid: user.oneid,
      maritalStatus: user.maritalStatus,
      constituency: user.constituency || `${user.district || 'Dhaka'}-8`,
      division: user.division,
      district: user.district,
      upazila: user.upazila,
      isAdult,
      isVoterEligible,
      hasDrivingLicense: !!user.drivingLicense,
      drivingLicenseStatus: user.drivingLicense?.status || 'NONE',
      taxPaymentStatus,
      ownedVehiclesCount,
      ownedPropertiesCount,
      hasVoted,
      activeElectionsCount: activeElectionIds.length
    });
  } catch (err) {
    next(err);
  }
});

export default router;
