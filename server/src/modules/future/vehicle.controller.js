import { prisma } from '../../prisma.js';
import { append as appendLedgerRecord } from '../../core/ledger.engine.js';
import { logEvent } from '../../core/audit.service.js';
import { createTransporter } from '../../shared/email.service.js';
import crypto from 'crypto';

// Help send visual emails / logs
async function notifyUser(email, subject, bodyText) {
  const transporter = createTransporter();
  console.log(`✉️ [OUTGOING VEHICLE NOTIFICATION] To: ${email} | Subject: "${subject}" | Msg: ${bodyText}`);
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"OneID BRTA Node" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 25px; background: #fafafa; border: 1px solid #eaeaea; border-radius: 12px; max-width: 550px; margin: auto;">
          <h2 style="color: #006a4e; margin-top: 0;">OneID Bangladesh • BRTA Node 🇧🇩</h2>
          <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
          <p style="font-size: 14px; line-height: 1.6; color: #333;">${bodyText}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 25px; margin-bottom: 10px;" />
          <caption style="font-size: 11px; color: #888;">This is an automated administrative broadcast from the OneID Core Blockchain Portal.</caption>
        </div>
      `
    });
  } catch (err) {
    console.error('Email notify fail:', err);
  }
}

// 1. APPLY FOR LICENSE
export const applyForLicense = async (req, res, next) => {
  try {
    const { category, bloodGroup } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'License category is a mandatory requirement.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.oneid) {
      return res.status(400).json({ error: 'Citizen account is not verified or lacks a OneID fingerprint.' });
    }

    const existingDl = await prisma.drivingLicense.findFirst({
      where: { citizenOneId: user.oneid }
    });
    if (existingDl) {
      return res.status(409).json({ error: 'A driving license or application is already registered for this citizen.' });
    }

    const division = user.division || 'DHAKA';
    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(10000 + Math.random() * 90000));
    const licenseNumber = `DL-${division.toUpperCase()}-${year}-${randomSuffix}`;

    const dlId = crypto.randomUUID();

    const ledgerRecord = await appendLedgerRecord('VEHICLE', {
      eventType: 'LICENSE_APPLICATION',
      licenseId: dlId,
      citizenOneId: user.oneid,
      category
    }, prisma);

    const dl = await prisma.drivingLicense.create({
      data: {
        id: dlId,
        licenseNumber,
        citizenOneId: user.oneid,
        category,
        bloodGroup: bloodGroup || 'O+',
        status: 'PENDING',
        ledgerRecordId: ledgerRecord.id
      }
    });

    await logEvent(
      req.user.userId,
      'LICENSE_APPLIED',
      `Driving license category ${category} application requested with suffix ${licenseNumber}`,
      req.ip
    );

    res.status(201).json(dl);
  } catch (err) {
    next(err);
  }
};

// 2. APPROVE LICENSE (ADMINS)
export const approveLicense = async (req, res, next) => {
  try {
    const { licenseId, action, rejectionReason } = req.body;
    if (!licenseId || !action) {
      return res.status(400).json({ error: 'licenseId and action parameter are required.' });
    }

    const dl = await prisma.drivingLicense.findUnique({
      where: { id: licenseId },
      include: { citizen: true }
    });
    if (!dl) {
      return res.status(404).json({ error: 'Driving license application not found.' });
    }

    if (action === 'APPROVE') {
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(issueDate.getFullYear() + 5);

      const ledgerRecord = await appendLedgerRecord('VEHICLE', {
        eventType: 'LICENSE_ISSUED',
        licenseId,
        citizenOneId: dl.citizenOneId,
        expiryDate: expiryDate.toISOString()
      }, prisma);

      const updated = await prisma.drivingLicense.update({
        where: { id: licenseId },
        data: {
          status: 'APPROVED',
          issueDate,
          expiryDate,
          ledgerRecordId: ledgerRecord.id
        }
      });

      if (dl.citizen?.email) {
        await notifyUser(
          dl.citizen.email,
          '🎉 Driving License Application Approved - BRTA Node',
          `Your driving license application (${dl.licenseNumber}) has been approved! The smart card credentials have been logged to the OneID sovereign ledger. Valid until ${expiryDate.toDateString()}.`
        );
      }

      await logEvent(
        req.user.userId,
        'LICENSE_APPROVE_SUCCESS',
        `Approved driving license ${dl.licenseNumber} for citizen ${dl.citizenOneId}`,
        req.ip
      );

      return res.json(updated);
    } else if (action === 'REJECT') {
      const updated = await prisma.drivingLicense.update({
        where: { id: licenseId },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Information criteria unfulfilled.'
        }
      });

      if (dl.citizen?.email) {
        await notifyUser(
          dl.citizen.email,
          '⚠️ Driving License Refused - BRTA Node',
          `Your license application (${dl.licenseNumber}) was rejected. Reason given: "${rejectionReason || 'Criteria mismatch.'}"`
        );
      }

      await logEvent(
        req.user.userId,
        'LICENSE_REJECT_SUCCESS',
        `Rejected application ${dl.licenseNumber} due to: ${rejectionReason}`,
        req.ip
      );

      return res.json(updated);
    } else {
      return res.status(400).json({ error: 'Action should be APPROVE or REJECT.' });
    }
  } catch (err) {
    next(err);
  }
};

// 3. REGISTER VEHICLE (CITIZEN WITH APPROVED LICENSE)
export const registerVehicle = async (req, res, next) => {
  try {
    const { type, make, model, year, color, engineNo, chassisNo } = req.body;
    if (!type || !make || !model || !year || !color || !engineNo || !chassisNo) {
      return res.status(400).json({ error: 'Please furnish all vehicle registration technical attributes.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.oneid) {
      return res.status(400).json({ error: 'Citizen profile not connected with a OneID.' });
    }

    // Citizen must have APPROVED license
    const dl = await prisma.drivingLicense.findFirst({
      where: { citizenOneId: user.oneid, status: 'APPROVED' }
    });
    if (!dl) {
      return res.status(400).json({ error: 'Citizen must possess an APPROVED driving license in OneID before registering a physical vehicle.' });
    }

    // Uniqueness of engine and chassis numbers
    const existingEngine = await prisma.vehicle.findFirst({
      where: {
        OR: [{ engineNo }, { chassisNo }]
      }
    });
    if (existingEngine) {
      return res.status(409).json({ error: 'Engine Number or Chassis Number is already in database.' });
    }

    const divisionStr = (user.division || 'DHAKA').toUpperCase();
    const lettersStr = String.fromCharCode(65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26));
    const digitsStr = String(Math.floor(1000 + Math.random() * 9000));
    const registrationNo = `${divisionStr}-GA-${lettersStr}-${digitsStr}`;

    const vehicleId = crypto.randomUUID();
    const roadTaxDueDate = new Date();
    roadTaxDueDate.setFullYear(roadTaxDueDate.getFullYear() + 1);

    const ledgerRecord = await appendLedgerRecord('VEHICLE', {
      eventType: 'VEHICLE_REGISTERED',
      vehicleId,
      ownerOneId: user.oneid,
      registrationNo
    }, prisma);

    const vehicle = await prisma.vehicle.create({
      data: {
        id: vehicleId,
        registrationNo,
        type,
        make,
        model,
        year: parseInt(year),
        color,
        engineNo,
        chassisNo,
        currentOwnerOneId: user.oneid,
        roadTaxDueDate,
        status: 'ACTIVE',
        ledgerRecordId: ledgerRecord.id
      }
    });

    await logEvent(
      req.user.userId,
      'VEHICLE_REGISTRATION_SUCCESS',
      `Registered vehicle ${registrationNo} for owner ${user.oneid}`,
      req.ip
    );

    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
};

// 4. GET MY VEHICLES
export const getMyVehicles = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.oneid) {
      return res.json({ vehicles: [], license: null });
    }

    const license = await prisma.drivingLicense.findUnique({
      where: { citizenOneId: user.oneid },
      include: {
        violations: {
          orderBy: { issuedAt: 'desc' }
        }
      }
    });

    const vehicles = await prisma.vehicle.findMany({
      where: { currentOwnerOneId: user.oneid },
      include: {
        violations: {
          orderBy: { issuedAt: 'desc' }
        },
        transfers: {
          orderBy: { initiatedAt: 'desc' }
        }
      }
    });

    res.json({ vehicles, license });
  } catch (err) {
    next(err);
  }
};

// 5. GET VEHICLE HISTORY (PUBLIC TRACE)
export const getVehicleHistory = async (req, res, next) => {
  try {
    const { registrationNo } = req.params;
    if (!registrationNo) {
      return res.status(400).json({ error: 'registrationNo is a mandatory query parameter.' });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { registrationNo }
    });
    if (!vehicle) {
      return res.status(404).json({ error: 'No vehicle was discovered matching the registration code in the national registry.' });
    }

    const transfers = await prisma.vehicleTransfer.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: { initiatedAt: 'asc' }
    });

    // Masker utility for compliance privacy
    const maskOneId = (oid) => {
      if (!oid) return 'BD-****-XXXX';
      if (oid.length < 5) return 'BD-****';
      return `BD-****-${oid.slice(-4)}`;
    };

    const sanitizedTransfers = transfers.map(t => ({
      ...t,
      fromOwnerOneId: maskOneId(t.fromOwnerOneId),
      toOwnerOneId: maskOneId(t.toOwnerOneId)
    }));

    res.json({
      vehicle: {
        registrationNo: vehicle.registrationNo,
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        status: vehicle.status,
        currentOwnerOneId: maskOneId(vehicle.currentOwnerOneId)
      },
      transfers: sanitizedTransfers
    });
  } catch (err) {
    next(err);
  }
};

// 6. INITIATE TRANSFER (SELLER)
export const initiateTransfer = async (req, res, next) => {
  try {
    const { vehicleId, toOwnerOneId } = req.body;
    if (!vehicleId || !toOwnerOneId) {
      return res.status(400).json({ error: 'Please furnish vehicleId and receiver toOwnerOneId.' });
    }

    const seller = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!seller || !seller.oneid) {
      return res.status(400).json({ error: 'Seller account lacks a registered OneID.' });
    }

    if (seller.oneid === toOwnerOneId) {
      return res.status(400).json({ error: 'Ownership transfer loop. You cannot sell a vehicle back to yourself.' });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle details not found.' });
    }

    if (vehicle.currentOwnerOneId !== seller.oneid) {
      return res.status(403).json({ error: 'Administrative check rejected: seller is not the registered owner of this vehicle.' });
    }

    // Buyer must have APPROVED driving license is a policy safeguard
    const buyerUser = await prisma.user.findUnique({
      where: { oneid: toOwnerOneId }
    });
    if (!buyerUser) {
      return res.status(400).json({ error: 'The requested recipient OneID does not refer to a registered citizen.' });
    }

    const buyerDl = await prisma.drivingLicense.findFirst({
      where: { citizenOneId: toOwnerOneId, status: 'APPROVED' }
    });
    if (!buyerDl) {
      return res.status(400).json({ error: 'Policy Block: Buyer must hold a fully verified & APPROVED Driving License.' });
    }

    // Check for open existing transfers
    const activeTransfer = await prisma.vehicleTransfer.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING_SELLER_SIGN', 'PENDING_BUYER_SIGN', 'PENDING_ADMIN'] }
      }
    });
    if (activeTransfer) {
      return res.status(400).json({ error: 'This vehicle already has an ongoing ownership transfer sequence in process.' });
    }

    const transfer = await prisma.vehicleTransfer.create({
      data: {
        vehicleId,
        fromOwnerOneId: seller.oneid,
        toOwnerOneId,
        sellerSignedAt: new Date(),
        status: 'PENDING_BUYER_SIGN'
      }
    });

    if (buyerUser.email) {
      await notifyUser(
        buyerUser.email,
        '📥 Vehicle Ownership Transfer Initiated - Action Required',
        `A vehicle transfer for registration (${vehicle.registrationNo}) has been initiated by owner ${seller.name} to you. Please enter your OneID cabinet dashboard to sign the buyer confirmation.`
      );
    }

    await logEvent(
      req.user.userId,
      'VEHICLE_TRANSFER_INITIATED',
      `Seller ${seller.oneid} initiated transfer of vehicle ${vehicle.registrationNo} to buyer ${toOwnerOneId}`,
      req.ip
    );

    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
};

// 7. BUYER ACCEPT TRANSFER (BUYER)
export const buyerAcceptTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.body;
    if (!transferId) {
      return res.status(400).json({ error: 'transferId parameter is missing.' });
    }

    const buyer = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!buyer || !buyer.oneid) {
      return res.status(400).json({ error: 'Buyer account is missing OneID.' });
    }

    const transfer = await prisma.vehicleTransfer.findUnique({
      where: { id: transferId },
      include: { vehicle: true }
    });
    if (!transfer) {
      return res.status(404).json({ error: 'Vehicle transfer request not found.' });
    }

    if (transfer.toOwnerOneId !== buyer.oneid) {
      return res.status(403).json({ error: 'Authorization error: you are not the designated buyer of this transfer.' });
    }

    if (transfer.status !== 'PENDING_BUYER_SIGN') {
      return res.status(400).json({ error: 'Transfer status is currently not in buyer signature step.' });
    }

    const updated = await prisma.vehicleTransfer.update({
      where: { id: transferId },
      data: {
        buyerSignedAt: new Date(),
        status: 'PENDING_ADMIN'
      }
    });

    await logEvent(
      req.user.userId,
      'VEHICLE_TRANSFER_SIGNED_BUYER',
      `Buyer ${buyer.oneid} signed and approved vehicle transfer ${transferId}. Awaiting final administrator audit.`,
      req.ip
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 8. ADMIN COMPLETE TRANSFER (ADMINS)
export const adminCompleteTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.body;
    if (!transferId) {
      return res.status(400).json({ error: 'transferId parameter is required.' });
    }

    const transfer = await prisma.vehicleTransfer.findUnique({
      where: { id: transferId },
      include: { vehicle: true }
    });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer request not found.' });
    }

    if (transfer.status !== 'PENDING_ADMIN') {
      return res.status(400).json({ error: 'This transfer is not ready for administrator approval (or already closed).' });
    }

    // Create cryptographic block seal
    const ledgerRecord = await appendLedgerRecord('VEHICLE', {
      eventType: 'OWNERSHIP_TRANSFER',
      vehicleId: transfer.vehicleId,
      fromOneId: transfer.fromOwnerOneId,
      toOneId: transfer.toOwnerOneId,
      transferId
    }, prisma);

    // Update vehicle ownership details
    await prisma.vehicle.update({
      where: { id: transfer.vehicleId },
      data: {
        currentOwnerOneId: transfer.toOwnerOneId,
        ledgerRecordId: ledgerRecord.id
      }
    });

    const updatedTransfer = await prisma.vehicleTransfer.update({
      where: { id: transferId },
      data: {
        adminApprovedAt: new Date(),
        status: 'COMPLETED',
        ledgerRecordId: ledgerRecord.id
      }
    });

    // Notify original owner and new owner
    const originalOwner = await prisma.user.findFirst({ where: { oneid: transfer.fromOwnerOneId } });
    const newOwner = await prisma.user.findFirst({ where: { oneid: transfer.toOwnerOneId } });

    if (originalOwner?.email) {
      await notifyUser(originalOwner.email, '📤 Vehicle Ownership Formally Transferred', `Ownership of vehicle ${transfer.vehicle.registrationNo} has been successfully updated in OneID. You are no longer registered as owner.`);
    }
    if (newOwner?.email) {
      await notifyUser(newOwner.email, '🎉 Vehicle Ownership Complete - BRTA Nod', `Congratulations! Ownership of vehicle ${transfer.vehicle.registrationNo} has been completed and registered to your OneID. Block ID sequence sealed.`);
    }

    await logEvent(
      req.user.userId,
      'VEHICLE_TRANSFER_COMPLETE',
      `Vehicle transfer ${transferId} complete! New owner is ${transfer.toOwnerOneId}`,
      req.ip
    );

    res.json(updatedTransfer);
  } catch (err) {
    next(err);
  }
};

// 9. RECORD VIOLATION (ADMINS)
export const recordViolation = async (req, res, next) => {
  try {
    const { licenseId, vehicleId, violationType, fineAmount } = req.body;
    if (!licenseId || !violationType || !fineAmount) {
      return res.status(400).json({ error: 'Please submit licenseId, violationType, and fineAmount parameters.' });
    }

    const dl = await prisma.drivingLicense.findUnique({
      where: { id: licenseId },
      include: { citizen: true }
    });
    if (!dl) {
      return res.status(404).json({ error: 'Target Driving License not found.' });
    }

    const admin = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const adminOneId = admin?.oneid || 'ADMIN-SYSTEM';

    const ledgerRecord = await appendLedgerRecord('VEHICLE', {
      eventType: 'VIOLATION_RECORDED',
      licenseId,
      violationType,
      fineAmount: parseFloat(fineAmount)
    }, prisma);

    const violation = await prisma.trafficViolation.create({
      data: {
        licenseId,
        vehicleId: vehicleId || null,
        violationType,
        fineAmount: parseFloat(fineAmount),
        fineStatus: 'UNPAID',
        issuedByOneId: adminOneId,
        ledgerRecordId: ledgerRecord.id
      }
    });

    // Policy condition check: "if total violations >= 5, set driving license status=SUSPENDED"
    const count = await prisma.trafficViolation.count({
      where: { licenseId }
    });

    let licenseStatusUpdated = false;
    if (count >= 5 && dl.status !== 'SUSPENDED') {
      await prisma.drivingLicense.update({
        where: { id: licenseId },
        data: { status: 'SUSPENDED' }
      });
      licenseStatusUpdated = true;

      const appendSuspend = await appendLedgerRecord('VEHICLE', {
        eventType: 'LICENSE_SUSPENDED',
        licenseId,
        reason: 'Accumulated 5 or more safety traffic violations.'
      }, prisma);

      if (dl.citizen?.email) {
        await notifyUser(
          dl.citizen.email,
          '⛔ OneID Driving License SUSPENDED - BRTA Node',
          `Critical Alert: Driving license (${dl.licenseNumber}) has been SUSPENDED by enforcement due to scoring ${count} high-severity traffic violations.`
        );
      }
    } else {
      if (dl.citizen?.email) {
        await notifyUser(
          dl.citizen.email,
          '🎫 New Traffic Ticket Violation Logged',
          `A new ticket fine of BDT ${fineAmount} was registered for the violation: "${violationType}". Please handle the outstanding fine immediately to prevent suspension risk.`
        );
      }
    }

    await logEvent(
      req.user.userId,
      'TRAFFIC_VIOLATION_LOGGED',
      `Fined license ${dl.licenseNumber} under ticket ID ${violation.id}. Suspended state triggered: ${licenseStatusUpdated}`,
      req.ip
    );

    res.status(201).json({ violation, licenseSuspended: licenseStatusUpdated });
  } catch (err) {
    next(err);
  }
};

// 10. PAY ROAD TAX
export const payRoadTax = async (req, res, next) => {
  try {
    const { vehicleId } = req.body;
    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required to pay road tax dues.' });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle details could not be found.' });
    }

    const roadTaxPaidAt = new Date();
    const roadTaxDueDate = new Date();
    roadTaxDueDate.setFullYear(roadTaxPaidAt.getFullYear() + 1);

    const ledgerRecord = await appendLedgerRecord('VEHICLE', {
      eventType: 'ROAD_TAX_PAID',
      vehicleId,
      newDueDate: roadTaxDueDate.toISOString()
    }, prisma);

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        roadTaxPaidAt,
        roadTaxDueDate,
        ledgerRecordId: ledgerRecord.id
      }
    });

    await logEvent(
      req.user.userId,
      'VEHICLE_ROAD_TAX_SETTLED',
      `Road tax settled for vehicle ${vehicle.registrationNo}. Next due: ${roadTaxDueDate.toDateString()}`,
      req.ip
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// EXTRA: PAY OUTSTANDING VIOLATION TICKET FINE AMOUNT
export const payViolation = async (req, res, next) => {
  try {
    const { violationId } = req.body;
    if (!violationId) {
      return res.status(400).json({ error: 'violationId is a required body parameter.' });
    }

    const violation = await prisma.trafficViolation.findUnique({
      where: { id: violationId },
      include: { license: true }
    });
    if (!violation) {
      return res.status(404).json({ error: 'Violation ticket record not found.' });
    }

    if (violation.fineStatus === 'PAID') {
      return res.status(400).json({ error: 'This ticket fine is already fully paid.' });
    }

    const ledgerRecord = await appendLedgerRecord('VEHICLE', {
      eventType: 'VIOLATION_FINE_PAID',
      violationId,
      fineAmount: violation.fineAmount
    }, prisma);

    const updatedViolation = await prisma.trafficViolation.update({
      where: { id: violationId },
      data: {
        fineStatus: 'PAID',
        ledgerRecordId: ledgerRecord.id
      }
    });

    // Check if license is suspended. If yes and total unpaid violations is now under 5, we can restore license!
    const unpaidCount = await prisma.trafficViolation.count({
      where: { licenseId: violation.licenseId, fineStatus: 'UNPAID' }
    });

    let licenseRestored = false;
    if (unpaidCount < 5 && violation.license.status === 'SUSPENDED') {
      await prisma.drivingLicense.update({
        where: { id: violation.licenseId },
        data: { status: 'APPROVED' }
      });
      licenseRestored = true;

      await appendLedgerRecord('VEHICLE', {
        eventType: 'LICENSE_RESTORED',
        licenseId: violation.licenseId,
        reason: 'Unpaid violations dropped under safety compliance threshold.'
      }, prisma);
    }

    await logEvent(
      req.user.userId,
      'VIOLATION_TICKET_PAID',
      `Paid fine BDT ${violation.fineAmount} for violation ${violationId}. License status restored: ${licenseRestored}`,
      req.ip
    );

    res.json({ violation: updatedViolation, licenseRestored });
  } catch (err) {
    next(err);
  }
};

// LIST DATA FOR ADMIN WORKSPACE OVERVIEWS
export const getAdminOverviewList = async (req, res, next) => {
  try {
    // 1. Fetch pending driving license applications
    const pendingLicenses = await prisma.drivingLicense.findMany({
      where: { status: 'PENDING' },
      include: { citizen: true },
      orderBy: { expiryDate: 'asc' } // just a fallback sort
    });

    // 2. Fetch all traffic violations
    const violations = await prisma.trafficViolation.findMany({
      include: {
        license: { include: { citizen: true } },
        vehicle: true
      },
      orderBy: { issuedAt: 'desc' }
    });

    // 3. Fetch pending transfers
    const pendingTransfers = await prisma.vehicleTransfer.findMany({
      where: { status: 'PENDING_ADMIN' },
      include: { vehicle: true },
      orderBy: { initiatedAt: 'desc' }
    });

    // 4. Counts by license status
    const approvedLicensesCount = await prisma.drivingLicense.count({ where: { status: 'APPROVED' } });
    const pendingLicensesCount = await prisma.drivingLicense.count({ where: { status: 'PENDING' } });
    const suspendedLicensesCount = await prisma.drivingLicense.count({ where: { status: 'SUSPENDED' } });
    const rejectedLicensesCount = await prisma.drivingLicense.count({ where: { status: 'REJECTED' } });

    res.json({
      pendingLicenses,
      violations,
      pendingTransfers,
      chartData: [
        { name: 'Active/Approved', value: approvedLicensesCount },
        { name: 'Pending Review', value: pendingLicensesCount },
        { name: 'Suspended State', value: suspendedLicensesCount },
        { name: 'Rejected Applications', value: rejectedLicensesCount }
      ]
    });
  } catch (err) {
    next(err);
  }
};

// LOOKUP RECIPIENT BUYER BY ONEID FOR SECURITY HANDSHAKE
export const lookupBuyer = async (req, res, next) => {
  try {
    const { toOwnerOneId } = req.params;
    if (!toOwnerOneId) {
      return res.status(400).json({ error: 'toOwnerOneId parameter is required.' });
    }

    const buyerUser = await prisma.user.findUnique({
      where: { oneid: toOwnerOneId }
    });
    if (!buyerUser) {
      return res.json({ found: false, error: 'No citizen discovered under this OneID code.' });
    }

    const buyerDl = await prisma.drivingLicense.findFirst({
      where: { citizenOneId: toOwnerOneId }
    });

    const isLicenseApproved = buyerDl && buyerDl.status === 'APPROVED';

    const maskName = (name) => {
      if (!name) return 'Sovereign Citizen';
      const parts = name.split(' ');
      return parts.map(p => p[0] + '*'.repeat(Math.max(1, p.length - 1))).join(' ');
    };

    res.json({
      found: true,
      name: maskName(buyerUser.name),
      hasLicense: isLicenseApproved,
      licenseStatus: buyerDl?.status || 'NONE',
      oneid: toOwnerOneId
    });
  } catch (err) {
    next(err);
  }
};

