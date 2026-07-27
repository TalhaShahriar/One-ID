import { prisma } from '../../prisma.js';
import { append as appendLedgerRecord } from '../../core/ledger.engine.js';
import { logEvent } from '../../core/audit.service.js';
import { createTransporter } from '../../shared/email.service.js';
import crypto from 'crypto';

// Help send visual emails / logs
async function notifyUser(email, subject, bodyText) {
  const transporter = createTransporter();
  console.log(`✉️ [OUTGOING PROPERTY NOTIFICATION] To: ${email} | Subject: "${subject}" | Msg: ${bodyText}`);
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"OneID Ministry of Land Node" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 25px; background: #FFF8E7; border: 2px solid #006a4e; border-radius: 12px; max-width: 550px; margin: auto;">
          <h2 style="color: #006a4e; margin-top: 0;">OneID Bangladesh • Ministry of Land Node 🇧🇩</h2>
          <hr style="border: 0; border-top: 2px solid #006a4e; margin-bottom: 20px;" />
          <p style="font-size: 14px; line-height: 1.6; color: #333;">${bodyText}</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 10px;" />
          <caption style="font-size: 11px; color: #666;">This is an automated administrative "Smart Contract" state transition from the OneID Core Ledger Registry.</caption>
        </div>
      `
    });
  } catch (err) {
    console.error('Email notify fail:', err);
  }
}

// SHA-256 helper
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// 1. REGISTER PROPERTY
export const registerProperty = async (req, res, next) => {
  try {
    const {
      title,
      address,
      division,
      district,
      upazila,
      mouza,
      khatianNumber,
      plotNumber,
      areaInDecimal,
      type,
      estimatedValueBDT
    } = req.body;

    if (!title || !address || !division || !district || !upazila || !mouza || !khatianNumber || !plotNumber || !areaInDecimal || !type) {
      return res.status(400).json({ error: 'All primary khatian and boundary parameters are mandatory for title registration.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.oneid) {
      return res.status(400).json({ error: 'Citizen account is not verified or lacks a valid OneID.' });
    }

    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(10000 + Math.random() * 90000));
    const propertyId = `PROP-${district.toUpperCase()}-${year}-${randomSuffix}`;

    const ledgerRecord = await appendLedgerRecord('PROPERTY', {
      eventType: 'PROPERTY_REGISTERED',
      propertyId,
      ownerOneId: user.oneid,
      khatianNumber,
      plotNumber
    }, prisma);

    const property = await prisma.property.create({
      data: {
        propertyId,
        title,
        address,
        division,
        district,
        upazila,
        mouza,
        khatianNumber,
        plotNumber,
        areaInDecimal: parseFloat(areaInDecimal),
        type,
        estimatedValueBDT: estimatedValueBDT ? parseFloat(estimatedValueBDT) : null,
        currentOwnerOneId: user.oneid,
        ledgerRecordId: ledgerRecord.id
      }
    });

    await logEvent(
      req.user.userId,
      'PROPERTY_REGISTERED',
      `Registered property card ${propertyId} for khatian ${khatianNumber} at Mouza ${mouza}`,
      req.ip
    );

    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
};

// 2. GET USER'S PROPERTIES
export const getMyProperties = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.oneid) {
      return res.json({ properties: [], activeIncomingTransfers: [] });
    }

    const properties = await prisma.property.findMany({
      where: { currentOwnerOneId: user.oneid },
      include: {
        transfers: {
          orderBy: { createdAt: 'desc' }
        },
        documents: true
      }
    });

    // Also fetch incoming transfers for the citizen to sign
    const activeIncomingTransfers = await prisma.propertyTransfer.findMany({
      where: {
        toOwnerOneId: user.oneid,
        status: { in: ['INITIATED', 'PENDING_BUYER_SIGN', 'PENDING_SELLER_SIGN'] }
      },
      include: {
        property: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ properties, activeIncomingTransfers });
  } catch (err) {
    next(err);
  }
};

// 3. GET DYNAMIC HISTORICAL TITLE (PUBLIC VERIFICATION)
export const getPropertyHistory = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId parameter path variable is required.' });
    }

    const property = await prisma.property.findUnique({
      where: { propertyId },
      include: {
        documents: true
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'No land record was found matching this Property ID.' });
    }

    const transfers = await prisma.propertyTransfer.findMany({
      where: { propertyId: property.id },
      orderBy: { createdAt: 'asc' }
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
      property: {
        propertyId: property.propertyId,
        title: property.title,
        address: property.address,
        division: property.division,
        district: property.district,
        upazila: property.upazila,
        mouza: property.mouza,
        khatianNumber: property.khatianNumber,
        plotNumber: property.plotNumber,
        areaInDecimal: property.areaInDecimal,
        type: property.type,
        estimatedValueBDT: property.estimatedValueBDT,
        hasDisputeFlag: property.hasDisputeFlag,
        disputeReason: property.disputeReason,
        currentOwnerOneId: maskOneId(property.currentOwnerOneId)
      },
      transfers: sanitizedTransfers,
      documents: property.documents
    });
  } catch (err) {
    next(err);
  }
};

// 4. FLAG DISPUTE (PROPERTY ENFORCEMENT OFFICER)
export const flagDispute = async (req, res, next) => {
  try {
    const { propertyId, reason } = req.body;
    if (!propertyId || !reason) {
      return res.status(400).json({ error: 'propertyId and structural dispute reason are mandatory.' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: 'No property file exists under this core sequence ID.' });
    }

    // Flag property as high risk dispute
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        hasDisputeFlag: true,
        disputeReason: reason
      }
    });

    // Invalidate any active, pending transfer by changing state → DISPUTED
    const pendingTransfers = await prisma.propertyTransfer.findMany({
      where: {
        propertyId: property.id,
        status: { in: ['INITIATED', 'PENDING_SELLER_SIGN', 'PENDING_BUYER_SIGN', 'PENDING_ADMIN_APPROVAL'] }
      }
    });

    if (pendingTransfers.length > 0) {
      await prisma.propertyTransfer.updateMany({
        where: {
          id: { in: pendingTransfers.map(pt => pt.id) }
        },
        data: {
          status: 'DISPUTED'
        }
      });
    }

    await logEvent(
      req.user.userId,
      'PROPERTY_DISPUTE_FLAGGED',
      `Registrar flagged property ${property.propertyId} as DISPUTED. Intercepted ${pendingTransfers.length} pending transfers.`,
      req.ip
    );

    res.json({
      success: true,
      property: updatedProperty,
      invalidatedTransfersCount: pendingTransfers.length
    });
  } catch (err) {
    next(err);
  }
};

// 5. INITIATE TRANSFER (SELLER OFFERS DEED SANCTION)
export const initiateTransfer = async (req, res, next) => {
  try {
    const { propertyId, toOwnerOneId, agreedPriceBDT } = req.body;
    if (!propertyId || !toOwnerOneId || !agreedPriceBDT) {
      return res.status(400).json({ error: 'propertyId, recipient OneID and agreedPriceBDT amount are required.' });
    }

    const seller = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!seller || !seller.oneid) {
      return res.status(400).json({ error: 'Seller account lacks a registered and validated OneID token.' });
    }

    if (seller.oneid === toOwnerOneId) {
      return res.status(400).json({ error: 'Self-transfer sequence blocked. You cannot sell a land title to your own OneID.' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    if (!property) {
      return res.status(404).json({ error: 'Land record not found.' });
    }

    if (property.currentOwnerOneId !== seller.oneid) {
      return res.status(403).json({ error: 'Permission denied: Seller is not the designated legal title holder of this property.' });
    }

    if (property.hasDisputeFlag) {
      return res.status(400).json({ error: 'Security Intercept: This property is flagged with an active boundary dispute and cannot be transferred.' });
    }

    // Buyer must refer to a registered citizen
    const buyerUser = await prisma.user.findUnique({ where: { oneid: toOwnerOneId } });
    if (!buyerUser) {
      return res.status(400).json({ error: 'Recipient OneID does not match any registered citizen in Bangladesh Core.' });
    }

    // Ensure no ongoing transfers
    const activeTransfer = await prisma.propertyTransfer.findFirst({
      where: {
        propertyId,
        status: { in: ['INITIATED', 'PENDING_SELLER_SIGN', 'PENDING_BUYER_SIGN', 'PENDING_ADMIN_APPROVAL'] }
      }
    });
    if (activeTransfer) {
      return res.status(400).json({ error: 'Ownership transfer already in lock state. Cancel ongoing transfer before initiating a new one.' });
    }

    // Cryptographic signature compute
    const timestamp = new Date().toISOString();
    const sellerSignatureHash = sha256(seller.oneid + propertyId + parseFloat(agreedPriceBDT) + timestamp);

    const transfer = await prisma.propertyTransfer.create({
      data: {
        propertyId,
        fromOwnerOneId: seller.oneid,
        toOwnerOneId,
        agreedPriceBDT: parseFloat(agreedPriceBDT),
        sellerSignatureHash,
        sellerSignedAt: new Date(),
        status: 'PENDING_BUYER_SIGN'
      }
    });

    if (buyerUser.email) {
      await notifyUser(
        buyerUser.email,
        '📥 OneID Land Deed Mutation: Signature Request',
        `An ownership transfer request for property ID ${property.propertyId} (${property.title}) has been initiated by ${seller.name} for BDT ${agreedPriceBDT}. Please log and sign with your OneID.`
      );
    }

    await logEvent(
      req.user.userId,
      'PROPERTY_TRANSFER_INITIATED',
      `Seller initiated transfer for property ${property.propertyId} to ${toOwnerOneId} (Sig: ${sellerSignatureHash.slice(0, 10)})`,
      req.ip
    );

    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
};

// 6. BUYER CONFIRMS TRANSFER
export const buyerConfirmTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.body;
    if (!transferId) {
      return res.status(400).json({ error: 'transferId parameter is missing.' });
    }

    const buyer = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!buyer || !buyer.oneid) {
      return res.status(400).json({ error: 'Buyer accounts require a verified OneID identity.' });
    }

    const transfer = await prisma.propertyTransfer.findUnique({
      where: { id: transferId },
      include: { property: true }
    });
    if (!transfer) {
      return res.status(404).json({ error: 'Land deed transfer log not found.' });
    }

    if (transfer.toOwnerOneId !== buyer.oneid) {
      return res.status(403).json({ error: 'Security mismatch: You are not specified as the designated buyer for this land deed.' });
    }

    if (transfer.status !== 'PENDING_BUYER_SIGN') {
      return res.status(400).json({ error: 'Transfer states are unsuited for signature at this timestamp.' });
    }

    if (transfer.property.hasDisputeFlag) {
      return res.status(400).json({ error: 'Sovereign Lock: Land deed carries a boundary dispute blocking the mutual process.' });
    }

    const timestamp = new Date().toISOString();
    const buyerSignatureHash = sha256(buyer.oneid + transferId + transfer.agreedPriceBDT + timestamp);

    const updated = await prisma.propertyTransfer.update({
      where: { id: transferId },
      data: {
        buyerSignatureHash,
        buyerSignedAt: new Date(),
        status: 'PENDING_ADMIN_APPROVAL'
      }
    });

    await logEvent(
      req.user.userId,
      'PROPERTY_TRANSFER_SIGNED_BUYER',
      `Buyer signed deed ${transferId}. Status updated to PENDING_ADMIN_APPROVAL (Sig: ${buyerSignatureHash.slice(0, 10)})`,
      req.ip
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 7. PROPERTY_ADMIN APPROVES AND DISPATCHES DUAL-SIGNsmart contract MUTATION
export const adminApproveTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.body;
    if (!transferId) {
      return res.status(400).json({ error: 'transferId parameter is required.' });
    }

    const transfer = await prisma.propertyTransfer.findUnique({
      where: { id: transferId },
      include: { property: true }
    });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer request could not be located.' });
    }

    const property = transfer.property;
    const adminUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const adminOneId = adminUser?.oneid || 'ADMIN-SYSTEM';

    // SMART CONTRACT CHECK: validate all 4 conditions
    // Tax clearance check for the seller
    const sellerTaxProfile = await prisma.taxProfile.findUnique({ where: { citizenOneId: transfer.fromOwnerOneId }, include: { returns: true } });
    let taxArrears = 0;
    if (sellerTaxProfile) {
      const unpaidReturns = sellerTaxProfile.returns.filter(r => ['UNPAID', 'PARTIALLY_PAID'].includes(r.paymentStatus));
      taxArrears = unpaidReturns.reduce((sum, r) => sum + ((r.finalTax || 0) - (r.paidAmount || 0)), 0);
    }
    if (taxArrears > 0) {
      return res.status(403).json({ error: 'SMART CONTRACT FAILED: Property transfer blocked because the seller has uncleared tax arrears.' });
    }
    
    const sellerSigned = !!transfer.sellerSignatureHash && !!transfer.sellerSignedAt;
    const buyerSigned = !!transfer.buyerSignatureHash && !!transfer.buyerSignedAt;
    const hasNoDispute = !property.hasDisputeFlag;
    const adminApproved = true; // This action itself serves as the admin approval condition

    if (!sellerSigned) {
      return res.status(403).json({ error: 'SMART CONTRACT FAILED: Seller has not signed the property deed.' });
    }
    if (!buyerSigned) {
      return res.status(403).json({ error: 'SMART CONTRACT FAILED: Buyer has not accepted or signed the property deed.' });
    }
    if (!hasNoDispute) {
      return res.status(403).json({ error: 'SMART CONTRACT FAILED: Property has an active dispute block.' });
    }

    // append block record
    const ledgerRecord = await appendLedgerRecord('PROPERTY', {
      eventType: 'OWNERSHIP_TRANSFERRED',
      propertyId: property.id,
      fromOneId: transfer.fromOwnerOneId,
      toOneId: transfer.toOwnerOneId,
      agreedPriceBDT: transfer.agreedPriceBDT,
      sellerSigHash: transfer.sellerSignatureHash,
      buyerSigHash: transfer.buyerSignatureHash
    }, prisma);

    // Update property owner and clear old dispute states if any, reset transfer state
    await prisma.property.update({
      where: { id: property.id },
      data: {
        currentOwnerOneId: transfer.toOwnerOneId,
        ledgerRecordId: ledgerRecord.id
      }
    });

    const updatedTransfer = await prisma.propertyTransfer.update({
      where: { id: transferId },
      data: {
        adminApprovedAt: new Date(),
        adminOneId,
        status: 'COMPLETED',
        ledgerRecordId: ledgerRecord.id
      }
    });

    const sellerUser = await prisma.user.findFirst({ where: { oneid: transfer.fromOwnerOneId } });
    const buyerUser = await prisma.user.findFirst({ where: { oneid: transfer.toOwnerOneId } });

    if (sellerUser?.email) {
      await notifyUser(
        sellerUser.email,
        '🎉 Property Deed Successfully Mutated & Closed',
        `The ownership mutation for Property ${property.propertyId} has been fully approved by the Registrar and signed to the national ledger. Value: BDT ${transfer.agreedPriceBDT}.`
      );
    }
    if (buyerUser?.email) {
      await notifyUser(
        buyerUser.email,
        '🎉 Property Deed Transfer Completed successfully',
        `Congratulations! Property ${property.propertyId} (${property.title}) is now registered to your OneID. Mutation verified at block index sequence.`
      );
    }

    await logEvent(
      req.user.userId,
      'PROPERTY_TRANSFER_MUTATED',
      `Sovereign admin approved mutation for deed ${transferId}. Property owner is now ${transfer.toOwnerOneId}. Ledger ID: ${ledgerRecord.id}`,
      req.ip
    );

    res.json(updatedTransfer);
  } catch (err) {
    next(err);
  }
};

// 8. CANCEL TRANSFER
export const cancelTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.body;
    if (!transferId) {
      return res.status(400).json({ error: 'transferId is required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.oneid) {
      return res.status(403).json({ error: 'Requester needs a valid OneID.' });
    }

    const transfer = await prisma.propertyTransfer.findUnique({
      where: { id: transferId }
    });
    if (!transfer) {
      return res.status(404).json({ error: 'Transfer record not found.' });
    }

    if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This transaction is already closed and cannot be cancelled.' });
    }

    // Must be either seller or buyer to cancel
    if (transfer.fromOwnerOneId !== user.oneid && transfer.toOwnerOneId !== user.oneid) {
      return res.status(403).json({ error: 'Only participants are allowed to rescind property deed mutations.' });
    }

    const updated = await prisma.propertyTransfer.update({
      where: { id: transferId },
      data: {
        status: 'CANCELLED'
      }
    });

    await logEvent(
      req.user.userId,
      'PROPERTY_TRANSFER_CANCELLED',
      `Citizen cancelled transfer proposal ${transferId}.`,
      req.ip
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 9. GET ALL PROPERTIES (ADMIN PORTAL)
export const getAllProperties = async (req, res, next) => {
  try {
    const { district, type, disputeFlag, page = 1, limit = 10 } = req.query;

    const where = {};
    if (district) {
      where.district = { equals: district.toString(), mode: 'insensitive' };
    }
    if (type) {
      where.type = type.toString();
    }
    if (disputeFlag !== undefined) {
      where.hasDisputeFlag = disputeFlag === 'true';
    }

    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const skip = (pageNum - 1) * limitNum;

    const total = await prisma.property.count({ where });
    const properties = await prisma.property.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        transfers: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { propertyId: 'asc' }
    });

    // Also fetch any property transfers across the system awaiting admin approval
    const pendingTransfers = await prisma.propertyTransfer.findMany({
      where: { status: 'PENDING_ADMIN_APPROVAL' },
      include: {
        property: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      properties,
      pendingTransfers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};
