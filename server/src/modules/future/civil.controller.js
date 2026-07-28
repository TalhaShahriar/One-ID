import { prisma } from '../../prisma.js';
import { append as appendLedgerRecord } from '../../core/ledger.engine.js';
import { logEvent } from '../../core/audit.service.js';
import { createTransporter } from '../../shared/email.service.js';
import crypto from 'crypto';

// Masker utility for compliance privacy
const maskOneId = (oid) => {
  if (!oid) return 'BD-****-XXXX';
  if (oid.length < 5) return 'BD-****';
  return `BD-****-${oid.slice(-4)}`;
};

// Help send visual emails / logs
async function notifyUser(email, subject, bodyText) {
  const transporter = createTransporter();
  console.log(`✉️ [OUTGOING CIVIL NOTIFICATION] To: ${email} | Subject: "${subject}" | Msg: ${bodyText}`);
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"OneID Civil Registry Node" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 25px; background: #FFF8E7; border: 2px solid #006a4e; border-radius: 12px; max-width: 550px; margin: auto;">
          <h2 style="color: #006a4e; margin-top: 0;">OneID Bangladesh • Civil Registry 🇧🇩</h2>
          <hr style="border: 0; border-top: 2px solid #006a4e; margin-bottom: 20px;" />
          <p style="font-size: 14px; line-height: 1.6; color: #333;">${bodyText}</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin-top: 25px; margin-bottom: 10px;" />
          <caption style="font-size: 11px; color: #666;">This is an automated state transition from the OneID Core Civil Registry.</caption>
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

// Helper: Verify OneID and details
export const verifyOneID = async (req, res, next) => {
  try {
    const { oneid } = req.params;
    if (!oneid) {
      return res.status(400).json({ error: 'oneid path parameter is required.' });
    }
    const user = await prisma.user.findUnique({
      where: { oneid: oneid.trim().toUpperCase() }
    });
    if (!user) {
      return res.status(404).json({ error: `Sovereign OneID '${oneid}' was not found in active registers.` });
    }

    const words = user.name.split(' ');
    const maskedName = words.map(w => w.length > 2 ? w[0] + '*'.repeat(w.length - 2) + w[w.length - 1] : w[0] + '*').join(' ');

    res.json({
      found: true,
      name: maskedName,
      maritalStatus: user.maritalStatus
    });
  } catch (err) {
    next(err);
  }
};

// 1. REGISTER MARRIAGE (NIKAH)
export const registerMarriage = async (req, res, next) => {
  try {
    const { groomOneId, brideOneId, witness1OneId, witness2OneId, mahrAmountBDT, mahrType, religion } = req.body;

    const gO = groomOneId.trim().toUpperCase();
    const bO = brideOneId.trim().toUpperCase();
    
    const groom = await prisma.user.findUnique({ where: { oneid: gO } });
    const bride = await prisma.user.findUnique({ where: { oneid: bO } });

    if (!groom) return res.status(404).json({ error: `Groom entity '${gO}' does not exist.` });
    if (!bride) return res.status(404).json({ error: `Bride entity '${bO}' does not exist.` });

    let finalReligion = religion;
    if (!finalReligion) {
      if (groom.religion === bride.religion) {
        finalReligion = groom.religion;
      } else {
        finalReligion = 'OTHER';
      }
    }

    if (finalReligion === 'ISLAM') {
      if (req.user.role !== 'KAZI_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Licensed Nikah Registrar (Kazi) keys required for Islamic marriages.' });
      }
      if (!witness1OneId || !witness2OneId || !mahrAmountBDT || !mahrType) {
        return res.status(400).json({ error: 'All primary marriage details (Groom, Bride, 2 Witnesses, Mahr details) are legally required for Nikah.' });
      }
    } else {
      if (req.user.role !== 'CIVIL_REGISTRY_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Civil Registry Admin required for civil marriage registration.' });
      }
    }

    if (gO === bO) {
      return res.status(400).json({ error: 'Marriage cannot be solemnized between identical OneID entities.' });
    }

    let w1 = witness1OneId ? witness1OneId.trim().toUpperCase() : null;
    let w2 = witness2OneId ? witness2OneId.trim().toUpperCase() : null;

    if (w1 && w2) {
      if (w1 === w2 || w1 === gO || w1 === bO || w2 === gO || w2 === bO) {
        return res.status(400).json({ error: 'Witnesses must represent unique external citizen entities, completely distinct from the groom or bride.' });
      }
    }

    if (groom.maritalStatus === 'MARRIED' || groom.maritalStatus === 'DIVORCE_PENDING') {
      return res.status(409).json({ error: `Cannot register — groom has active marriage status: '${groom.maritalStatus}'. OneID prevents bigamy.` });
    }
    if (bride.maritalStatus === 'MARRIED' || bride.maritalStatus === 'DIVORCE_PENDING') {
      return res.status(409).json({ error: `Cannot register — bride has active marriage status: '${bride.maritalStatus}'. OneID prevents bigamy.` });
    }

    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(10000 + Math.random() * 90000));
    
    let marriageId, nikahnaamaHash = null;
    let eventType = 'MARRIAGE_REGISTERED';
    let recordLabel = 'Marriage Record Code';
    
    if (finalReligion === 'ISLAM') {
      marriageId = `NIKAH-${year}-${randomSuffix}`;
      nikahnaamaHash = sha256(gO + bO + String(mahrAmountBDT) + new Date().toISOString() + (req.user.oneid || 'SYSTEM_KAZI'));
    } else {
      marriageId = `CIVIL-${year}-${randomSuffix}`;
    }

    const registrationDate = new Date();

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType,
      marriageId,
      groomOneId: gO,
      brideOneId: bO,
      religion: finalReligion,
      nikahnaamaHash: nikahnaamaHash || undefined
    }, prisma);

    const marriage = await prisma.marriageRecord.create({
      data: {
        marriageId,
        groomOneId: gO,
        brideOneId: bO,
        kaziOneId: (finalReligion === 'ISLAM' ? (req.user.oneid || 'KAZI-ADMIN') : null),
        witness1OneId: w1,
        witness2OneId: w2,
        mahrAmountBDT: (finalReligion === 'ISLAM' ? parseFloat(mahrAmountBDT) : null),
        mahrType: (finalReligion === 'ISLAM' ? mahrType : null),
        registrationDate,
        nikahnaamaHash,
        religion: finalReligion,
        status: 'ACTIVE',
        ledgerRecordId: ledgerRecord.id
      }
    });

    await prisma.user.update({ where: { oneid: gO }, data: { maritalStatus: 'MARRIED' } });
    await prisma.user.update({ where: { oneid: bO }, data: { maritalStatus: 'MARRIED' } });

    await logEvent(req.user.userId, 'CIVIL_MARRIAGE_REGISTERED', `${finalReligion === 'ISLAM' ? 'Kazi solemnized Nikah' : 'Civil Registry logged marriage'}: ${marriageId} for Groom: ${gO} & Bride: ${bO}`, req.ip);
    
    const docTitle = finalReligion === 'ISLAM' ? "Nikah Certificate Registered Successfully" : "Civil Marriage Registered Successfully";
    await notifyUser(groom.email, docTitle, `Your marriage has been legally registered on the OneID Sovereign Civil Ledger. ${recordLabel}: <b>${marriageId}</b>.`);
    await notifyUser(bride.email, docTitle, `Your marriage has been legally registered on the OneID Sovereign Civil Ledger. ${recordLabel}: <b>${marriageId}</b>.`);

    res.json({ success: true, marriageId, marriage });
  } catch (err) {
    next(err);
  }
};

// 2. GET CURRENT USER MARRIAGE STATUS
export const getMyMarriageStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !user.oneid) {
      return res.status(400).json({ error: 'Citizen profile lacks a verified OneID identity.' });
    }

    const marriage = await prisma.marriageRecord.findFirst({
      where: {
        OR: [
          { groomOneId: user.oneid },
          { brideOneId: user.oneid }
        ],
        status: { in: ['ACTIVE', 'DIVORCE_PENDING'] }
      },
      include: {
        divorceProceeding: true
      }
    });

    res.json({
      maritalStatus: user.maritalStatus,
      marriage: marriage ? {
        id: marriage.id,
        marriageId: marriage.marriageId,
        groomOneId: marriage.groomOneId,
        brideOneId: marriage.brideOneId,
        kaziOneId: marriage.kaziOneId,
        witness1OneId: marriage.witness1OneId,
        witness2OneId: marriage.witness2OneId,
        mahrAmountBDT: marriage.mahrAmountBDT,
        mahrType: marriage.mahrType,
        registrationDate: marriage.registrationDate,
        nikahnaamaHash: marriage.nikahnaamaHash,
        status: marriage.status,
        ledgerRecordId: marriage.ledgerRecordId,
        divorceProceeding: marriage.divorceProceeding
      } : null
    });
  } catch (err) {
    next(err);
  }
};

// 3. INITIATE TALAQ NOTICE (Husband serving Talaq under 1974 Act)
export const filingTalaqNotice = async (req, res, next) => {
  try {
    const { marriageId, divorceType } = req.body;

    if (!marriageId || !divorceType) {
      return res.status(400).json({ error: 'marriageId and divorceType are mandatory parameters to serving a Divorce Notice.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const marriage = await prisma.marriageRecord.findUnique({
      where: { marriageId },
      include: { groom: true, bride: true }
    });

    if (!marriage) {
      return res.status(404).json({ error: "No matching marriage certificate was found." });
    }

    if (marriage.groomOneId !== user.oneid && marriage.brideOneId !== user.oneid) {
      return res.status(403).json({ error: 'Only the bride or groom of the marriage can initiate a divorce proceeding.' });
    }

    if (marriage.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Active marriage certification is required before serving a dissolution.' });
    }

    const noticeFiledAt = new Date();
    const effectiveDate = new Date(noticeFiledAt.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from notice date

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType: 'DIVORCE_NOTICE_FILED',
      marriageId: marriage.marriageId,
      noticeFiledAt,
      effectiveDate
    }, prisma);

    let finalType = divorceType;
    if (marriage.religion !== 'ISLAM') {
      finalType = 'CIVIL';
    }

    const proceeding = await prisma.divorceProceeding.create({
      data: {
        marriageId: marriage.id,
        initiatorOneId: user.oneid,
        divorceType: finalType,
        noticeFiledAt,
        effectiveDate,
        status: 'NOTICE_FILED',
        ledgerRecordId: ledgerRecord.id
      }
    });

    await prisma.marriageRecord.update({
      where: { id: marriage.id },
      data: { status: 'DIVORCE_PENDING' }
    });

    // Write maritalStatus updates
    await prisma.user.update({ where: { oneid: marriage.groomOneId }, data: { maritalStatus: 'DIVORCE_PENDING' } });
    await prisma.user.update({ where: { oneid: marriage.brideOneId }, data: { maritalStatus: 'DIVORCE_PENDING' } });

    await logEvent(user.id, 'CIVIL_DIVORCE_NOTICE_FILED', `Notice served for Marriage ID ${marriageId}. Wait period scheduled on ${effectiveDate.toDateString()}`, req.ip);
    
    // Notify Citizens
    await notifyUser(marriage.groom.email, "Divorce Notice Active", `A Divorce Notice has been formally logged against Marriage Record ${marriageId}. Wait period is active.`);
    await notifyUser(marriage.bride.email, "Divorce Notice Active", `A Divorce Notice has been formally logged against Marriage Record ${marriageId}. Wait period is active.`);
    
    res.json({ success: true, proceeding });
  } catch (err) {
    next(err);
  }
};

// 4. FORM ARBITRATION COUNCIL (Within 30 days) — LOCAL_AUTHORITY_ADMIN
export const formArbitrationCouncil = async (req, res, next) => {
  try {
    const { divorceProceedingId } = req.body;

    if (req.user.role !== 'LOCAL_AUTHORITY_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access restricted: Local Authority (Union Parishad Chairman) credentials required.' });
    }

    const proceeding = await prisma.divorceProceeding.findUnique({
      where: { id: divorceProceedingId },
      include: { marriage: true }
    });

    if (!proceeding) {
      return res.status(404).json({ error: 'No active notice records exist matching this proceeding code.' });
    }

    const diffDays = (new Date() - new Date(proceeding.noticeFiledAt)) / (24 * 60 * 60 * 1000);
    if (diffDays > 30) {
      return res.status(400).json({ error: 'Council configuration timeline violated. Muslim Law Sec 7 forces setup within 30 days.' });
    }

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType: 'ARBITRATION_COUNCIL_FORMED',
      divorceProceedingId,
      chairmanOneId: req.user.oneid || 'CHAIRMAN-ADMIN'
    }, prisma);

    const updated = await prisma.divorceProceeding.update({
      where: { id: divorceProceedingId },
      data: {
        arbitrationFormedAt: new Date(),
        chairmanOneId: req.user.oneid || 'CHAIRMAN-ADMIN',
        status: 'ARBITRATION_ACTIVE',
        ledgerRecordId: ledgerRecord.id
      }
    });

    await logEvent(req.user.userId, 'CIVIL_ARBITRATION_FORMED', `Chairman formed council for proceeding ID ${divorceProceedingId}`, req.ip);

    res.json({ success: true, proceeding: updated });
  } catch (err) {
    next(err);
  }
};

// 5. REGISTER RECONCILIATION SESSIONS ATTEMPTS — LOCAL_AUTHORITY_ADMIN
export const logReconciliationAttempt = async (req, res, next) => {
  try {
    const { divorceProceedingId } = req.body;

    if (req.user.role !== 'LOCAL_AUTHORITY_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chairman authentication required.' });
    }

    const proceeding = await prisma.divorceProceeding.findUnique({ where: { id: divorceProceedingId } });
    if (!proceeding) {
      return res.status(404).json({ error: 'Proceeding not found.' });
    }

    const updated = await prisma.divorceProceeding.update({
      where: { id: divorceProceedingId },
      data: { reconciliationAttempts: { increment: 1 } }
    });

    res.json({ success: true, reconciliationAttempts: updated.reconciliationAttempts });
  } catch (err) {
    next(err);
  }
};

// 6. MANUALLY MARITAL RECONCILIATION — LOCAL_AUTHORITY_ADMIN
export const reconcileMarriage = async (req, res, next) => {
  try {
    const { divorceProceedingId } = req.body;

    if (req.user.role !== 'LOCAL_AUTHORITY_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chairman authentication required.' });
    }

    const proceeding = await prisma.divorceProceeding.findUnique({
      where: { id: divorceProceedingId },
      include: { marriage: { include: { groom: true, bride: true } } }
    });

    if (!proceeding) {
      return res.status(404).json({ error: 'Agreement record not found.' });
    }

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType: 'MARRIAGE_RECONCILED',
      divorceProceedingId,
      marriageId: proceeding.marriage.marriageId
    }, prisma);

    await prisma.divorceProceeding.update({
      where: { id: divorceProceedingId },
      data: { status: 'RECONCILED', ledgerRecordId: ledgerRecord.id }
    });

    await prisma.marriageRecord.update({
      where: { id: proceeding.marriageId },
      data: { status: 'ACTIVE' }
    });

    await prisma.user.update({ where: { oneid: proceeding.marriage.groomOneId }, data: { maritalStatus: 'MARRIED' } });
    await prisma.user.update({ where: { oneid: proceeding.marriage.brideOneId }, data: { maritalStatus: 'MARRIED' } });

    await notifyUser(proceeding.marriage.groom.email, "Nikah Certificate Restored", `Reconciliation attempts successful. Under order from Union Parishad, mutual marriage <b>${proceeding.marriage.marriageId}</b> is restored as ACTIVE.`);
    await notifyUser(proceeding.marriage.bride.email, "Nikah Certificate Restored", `Reconciliation attempts successful. Under order from Union Parishad, mutual marriage <b>${proceeding.marriage.marriageId}</b> is restored as ACTIVE.`);

    res.json({ success: true, status: 'RECONCILED' });
  } catch (err) {
    next(err);
  }
};

// 7. FINALIZE DISSOLUTION TRANSITION (Requires 90 days delay elapsed) — ADMIN / CHAIRMAN
export const finalizeDivorce = async (req, res, next) => {
  try {
    const { divorceProceedingId } = req.body;

    if (req.user.role !== 'LOCAL_AUTHORITY_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chairman authentication required.' });
    }

    const proceeding = await prisma.divorceProceeding.findUnique({
      where: { id: divorceProceedingId },
      include: { marriage: { include: { groom: true, bride: true } } }
    });

    if (!proceeding) return res.status(404).json({ error: 'Proceedings not found.' });
    if (proceeding.status !== 'ARBITRATION_ACTIVE' && proceeding.status !== 'NOTICE_FILED') {
      return res.status(400).json({ error: 'Only active, unresolved divorce processes can be finalized.' });
    }

    if (new Date() < new Date(proceeding.effectiveDate)) {
      return res.status(400).json({ error: 'Wait period mismatch: Under Bangladesh Legal Code, Talaq is frozen during a 90-day arbitration buffer.' });
    }

    const actualEffectiveDate = new Date();
    const certificateHash = sha256(proceeding.marriage.marriageId + proceeding.id + actualEffectiveDate.toISOString());

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType: 'DIVORCE_FINALIZED',
      marriageId: proceeding.marriage.marriageId,
      proceedingId: proceeding.id,
      certificateHash
    }, prisma);

    await prisma.divorceProceeding.update({
      where: { id: divorceProceedingId },
      data: {
        status: 'FINALIZED',
        actualEffectiveDate,
        certificateHash,
        ledgerRecordId: ledgerRecord.id
      }
    });

    await prisma.marriageRecord.update({
      where: { id: proceeding.marriageId },
      data: { status: 'DISSOLVED' }
    });

    await prisma.user.update({ where: { oneid: proceeding.marriage.groomOneId }, data: { maritalStatus: 'DIVORCED' } });
    await prisma.user.update({ where: { oneid: proceeding.marriage.brideOneId }, data: { maritalStatus: 'DIVORCED' } });

    await notifyUser(proceeding.marriage.groom.email, "Marital Dissolution Certificate Dispatched", `Your marriage dissolution is finalized. Dissolution certificate hash: <b>${certificateHash}</b>.`);
    await notifyUser(proceeding.marriage.bride.email, "Marital Dissolution Certificate Dispatched", `Your marriage dissolution is finalized. Dissolution certificate hash: <b>${certificateHash}</b>.`);

    res.json({ success: true, status: 'FINALIZED', certificateHash });
  } catch (err) {
    next(err);
  }
};

// 8. VERIFY CERTIFICATE (PUBLIC — NO LOGIN REQUIRED)
export const verifyCertificate = async (req, res, next) => {
  try {
    const { elementId } = req.params;
    if (!elementId) {
      return res.status(400).json({ error: 'Search ID/hash code element parameter is required.' });
    }

    const queryId = elementId.trim().toUpperCase();

    // Search MarriageRecord
    let marriage = await prisma.marriageRecord.findFirst({
      where: {
        OR: [
          { marriageId: queryId },
          { id: elementId.trim() }
        ]
      },
      include: { divorceProceeding: true }
    });

    let proceeding = null;
    if (!marriage) {
      // Search DivorceProceeding by hash
      proceeding = await prisma.divorceProceeding.findFirst({
        where: {
          OR: [
            { certificateHash: elementId.trim().toLowerCase() },
            { certificateHash: elementId.trim() },
            { id: elementId.trim() }
          ]
        },
        include: { marriage: true }
      });
      if (proceeding) {
        marriage = proceeding.marriage;
      }
    } else {
      proceeding = marriage.divorceProceeding;
    }

    if (!marriage) {
      // Search BirthRecord
      const birth = await prisma.birthRecord.findFirst({
        where: {
          OR: [
            { id: elementId.trim() },
            { ledgerRecordId: elementId.trim() }
          ]
        }
      });
      if (birth) {
        return res.json({
          recordFound: true,
          type: 'BIRTH_CERTIFICATE',
          id: birth.id,
          childName: birth.childName,
          dateOfBirth: birth.dateOfBirth,
          placeOfBirth: birth.placeOfBirth,
          fatherOneId: birth.fatherOneId ? maskOneId(birth.fatherOneId) : 'N/A',
          motherOneId: birth.motherOneId ? maskOneId(birth.motherOneId) : 'N/A',
          ledgerRecordId: birth.ledgerRecordId,
          createdAt: birth.createdAt
        });
      }

      // Search DeathRecord
      const death = await prisma.deathRecord.findFirst({
        where: {
          OR: [
            { id: elementId.trim() },
            { ledgerRecordId: elementId.trim() }
          ]
        }
      });
      if (death) {
        return res.json({
          recordFound: true,
          type: 'DEATH_CERTIFICATE',
          id: death.id,
          deceasedOneId: maskOneId(death.deceasedOneId),
          dateOfDeath: death.dateOfDeath,
          causeOfDeath: death.causeOfDeath,
          ledgerRecordId: death.ledgerRecordId,
          createdAt: death.createdAt
        });
      }

      return res.status(404).json({ error: 'No matching marriages, divorces, birth records, or death records detected on active public ledger channels.' });
    }

    res.json({
      recordFound: true,
      type: (proceeding && proceeding.status === 'FINALIZED') ? 'DIVORCE_DISSOLUTION' : 'MARRIAGE_NIKAH',
      marriageId: marriage.marriageId,
      registrationDate: marriage.registrationDate,
      mahrAmountBDT: marriage.mahrAmountBDT,
      mahrType: marriage.mahrType,
      groomOneId: maskOneId(marriage.groomOneId),
      brideOneId: maskOneId(marriage.brideOneId),
      status: (proceeding && proceeding.status === 'FINALIZED') ? 'DISSOLVED' : marriage.status,
      ledgerRecordId: (proceeding && proceeding.status === 'FINALIZED') ? proceeding.ledgerRecordId : marriage.ledgerRecordId,
      divorceDetails: proceeding ? {
        divorceType: proceeding.divorceType,
        noticeFiledAt: proceeding.noticeFiledAt,
        status: proceeding.status,
        reconciliationAttempts: proceeding.reconciliationAttempts,
        effectiveDate: proceeding.effectiveDate,
        actualEffectiveDate: proceeding.actualEffectiveDate,
        certificateHash: proceeding.certificateHash,
        ledgerRecordId: proceeding.ledgerRecordId
      } : null
    });
  } catch (err) {
    next(err);
  }
};

// 9. ADMIN GET ALL PROCEEDINGS
export const getAdminProceedings = async (req, res, next) => {
  try {
    if (req.user.role !== 'LOCAL_AUTHORITY_ADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access restricted to administrators / Local Chairman.' });
    }

    const proceedings = await prisma.divorceProceeding.findMany({
      include: {
        marriage: true
      },
      orderBy: {
        noticeFiledAt: 'desc'
      }
    });

    res.json({ success: true, proceedings });
  } catch (err) {
    next(err);
  }
};

export const registerBirth = async (req, res, next) => {
  try {
    const { childName, dateOfBirth, placeOfBirth, fatherOneId, motherOneId } = req.body;
    if (!childName || !dateOfBirth || !placeOfBirth) {
      return res.status(400).json({ error: 'Child Name, Date of Birth, and Place of Birth are required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const userOneId = user?.oneid || null;

    const record = await prisma.birthRecord.create({
      data: {
        childName,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth,
        fatherOneId: fatherOneId || userOneId,
        motherOneId: motherOneId || null
      }
    });

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType: 'BIRTH_REGISTERED',
      recordId: record.id,
      childName,
      dateOfBirth,
      placeOfBirth
    }, prisma);

    await prisma.birthRecord.update({ where: { id: record.id }, data: { ledgerRecordId: ledgerRecord.id } });

    res.json({ success: true, record: { ...record, ledgerRecordId: ledgerRecord.id }, certificateUrl: `/api/civil-registry/birth/${record.id}` });
  } catch (err) { next(err); }
};

export const registerDeath = async (req, res, next) => {
  try {
    const { deceasedOneId, dateOfDeath, causeOfDeath } = req.body;
    if (!deceasedOneId || !dateOfDeath) {
      return res.status(400).json({ error: 'Deceased OneID and Date of Death are required.' });
    }

    const record = await prisma.deathRecord.create({
      data: {
        deceasedOneId,
        dateOfDeath: new Date(dateOfDeath),
        causeOfDeath: causeOfDeath || 'Natural Causes'
      }
    });

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType: 'DEATH_REGISTERED',
      recordId: record.id,
      deceasedOneId,
      dateOfDeath
    }, prisma);

    await prisma.deathRecord.update({ where: { id: record.id }, data: { ledgerRecordId: ledgerRecord.id } });

    res.json({ success: true, record: { ...record, ledgerRecordId: ledgerRecord.id }, certificateUrl: `/api/civil-registry/death/${record.id}` });
  } catch (err) { next(err); }
};

export const getMyBirthRecords = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const oneid = user?.oneid;

    let records;
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'CIVIL_REGISTRY_ADMIN') {
      records = await prisma.birthRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    } else if (oneid) {
      records = await prisma.birthRecord.findMany({
        where: {
          OR: [
            { fatherOneId: oneid },
            { motherOneId: oneid }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      records = await prisma.birthRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    }

    res.json({ success: true, records });
  } catch (err) { next(err); }
};

export const getMyDeathRecords = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const oneid = user?.oneid;

    let records;
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'CIVIL_REGISTRY_ADMIN') {
      records = await prisma.deathRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    } else if (oneid) {
      records = await prisma.deathRecord.findMany({
        where: { deceasedOneId: oneid },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      records = await prisma.deathRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    }

    res.json({ success: true, records });
  } catch (err) { next(err); }
};

export const getBirthCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await prisma.birthRecord.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Birth record not found.' });

    res.json({ success: true, record });
  } catch (err) { next(err); }
};

export const getDeathCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await prisma.deathRecord.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ error: 'Death record not found.' });

    res.json({ success: true, record });
  } catch (err) { next(err); }
};

export const applyMarriage = async (req, res, next) => {
  try {
    const { partnerOneId, witness1OneId, witness2OneId, mahrAmountBDT, mahrType, religion, roleType } = req.body;
    if (!partnerOneId) return res.status(400).json({ error: 'Partner OneID is required.' });

    const applicant = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!applicant || !applicant.oneid) return res.status(400).json({ error: 'Applicant profile lacks a valid OneID identity.' });

    const pO = partnerOneId.trim().toUpperCase();
    const partner = await prisma.user.findUnique({ where: { oneid: pO } });
    if (!partner) return res.status(404).json({ error: `Partner OneID '${pO}' not found in civil records.` });

    if (applicant.maritalStatus === 'MARRIED' || applicant.maritalStatus === 'DIVORCE_PENDING') {
      return res.status(409).json({ error: `Cannot apply: Applicant has active marital status '${applicant.maritalStatus}'. Bigamy is prohibited.` });
    }
    if (partner.maritalStatus === 'MARRIED' || partner.maritalStatus === 'DIVORCE_PENDING') {
      return res.status(409).json({ error: `Cannot apply: Partner has active marital status '${partner.maritalStatus}'. Bigamy is prohibited.` });
    }

    if (applicant.oneid === pO) {
      return res.status(400).json({ error: 'Groom and Bride cannot possess identical OneIDs.' });
    }

    // Determine Groom & Bride IDs
    let groomOneId, brideOneId;
    if (roleType === 'BRIDE') {
      brideOneId = applicant.oneid;
      groomOneId = pO;
    } else {
      groomOneId = applicant.oneid;
      brideOneId = pO;
    }

    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(10000 + Math.random() * 90000));
    const marriageId = `APP-${year}-${randomSuffix}`;

    const application = await prisma.marriageRecord.create({
      data: {
        marriageId,
        groomOneId,
        brideOneId,
        witness1OneId: witness1OneId ? witness1OneId.trim().toUpperCase() : null,
        witness2OneId: witness2OneId ? witness2OneId.trim().toUpperCase() : null,
        mahrAmountBDT: mahrAmountBDT ? parseFloat(mahrAmountBDT) : null,
        mahrType: mahrType || 'PROMPT',
        religion: religion || applicant.religion || 'ISLAM',
        status: 'PENDING_APPROVAL'
      }
    });

    await logEvent(req.user.userId, 'MARRIAGE_APPLICATION_SUBMITTED', `Wedding application ${marriageId} submitted for Groom: ${groomOneId} & Bride: ${brideOneId}`, req.ip);

    const approver = (religion || applicant.religion) === 'ISLAM' ? 'Kazi (Licensed Registrar)' : 'Civil Registrar Office';
    res.json({
      success: true,
      application,
      message: `Wedding Application ${marriageId} submitted successfully! Awaiting approval & Kabinnama issuance by ${approver}.`
    });
  } catch (err) { next(err); }
};

export const getMarriageApplications = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    
    let applications;
    if (req.user.role === 'KAZI_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'CIVIL_REGISTRY_ADMIN') {
      applications = await prisma.marriageRecord.findMany({
        where: { status: 'PENDING_APPROVAL' },
        orderBy: { registrationDate: 'desc' }
      });
    } else if (user?.oneid) {
      applications = await prisma.marriageRecord.findMany({
        where: {
          OR: [
            { groomOneId: user.oneid },
            { brideOneId: user.oneid }
          ]
        },
        orderBy: { registrationDate: 'desc' }
      });
    } else {
      applications = [];
    }

    res.json({ success: true, applications });
  } catch (err) { next(err); }
};

export const approveMarriageApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'KAZI_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CIVIL_REGISTRY_ADMIN') {
      return res.status(403).json({ error: 'Access denied: Licensed Kazi / Civil Registrar credentials required.' });
    }

    const application = await prisma.marriageRecord.findUnique({ where: { id } });
    if (!application) {
      return res.status(404).json({ error: 'Marriage application not found.' });
    }

    if (application.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: `Application is already in state '${application.status}'.` });
    }

    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(10000 + Math.random() * 90000));
    const officialMarriageId = application.religion === 'ISLAM' ? `NIKAH-${year}-${randomSuffix}` : `CIVIL-${year}-${randomSuffix}`;
    const nikahnaamaHash = sha256(application.groomOneId + application.brideOneId + String(application.mahrAmountBDT || 0) + new Date().toISOString() + (req.user.oneid || 'KAZI_ADMIN'));

    const ledgerRecord = await appendLedgerRecord('CIVIL_REGISTRY', {
      eventType: 'MARRIAGE_REGISTERED',
      marriageId: officialMarriageId,
      groomOneId: application.groomOneId,
      brideOneId: application.brideOneId,
      religion: application.religion,
      nikahnaamaHash
    }, prisma);

    const updatedMarriage = await prisma.marriageRecord.update({
      where: { id },
      data: {
        marriageId: officialMarriageId,
        kaziOneId: req.user.oneid || 'KAZI-DHAKA-01',
        nikahnaamaHash,
        status: 'ACTIVE',
        registrationDate: new Date(),
        ledgerRecordId: ledgerRecord.id
      }
    });

    await prisma.user.update({ where: { oneid: application.groomOneId }, data: { maritalStatus: 'MARRIED' } });
    await prisma.user.update({ where: { oneid: application.brideOneId }, data: { maritalStatus: 'MARRIED' } });

    await logEvent(req.user.userId, 'KAZI_MARRIAGE_APPROVED', `Kazi approved wedding application. Issued Kabinnama ${officialMarriageId}`, req.ip);

    const groom = await prisma.user.findUnique({ where: { oneid: application.groomOneId } });
    const bride = await prisma.user.findUnique({ where: { oneid: application.brideOneId } });

    if (groom?.email) notifyUser(groom.email, "Kabinnama / Nikah Certificate Issued", `Your marriage application has been approved by Kazi. Official Nikah ID: <b>${officialMarriageId}</b>.`);
    if (bride?.email) notifyUser(bride.email, "Kabinnama / Nikah Certificate Issued", `Your marriage application has been approved by Kazi. Official Nikah ID: <b>${officialMarriageId}</b>.`);

    res.json({
      success: true,
      marriage: updatedMarriage,
      message: `Wedding application approved! Digital Kabinnama / Nikahnama generated with ID ${officialMarriageId}`
    });
  } catch (err) { next(err); }
};

export const rejectMarriageApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'KAZI_ADMIN' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CIVIL_REGISTRY_ADMIN') {
      return res.status(403).json({ error: 'Access denied: Licensed Kazi / Civil Registrar credentials required.' });
    }

    const application = await prisma.marriageRecord.findUnique({ where: { id } });
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    await prisma.marriageRecord.delete({ where: { id } });

    await logEvent(req.user.userId, 'KAZI_MARRIAGE_REJECTED', `Kazi rejected marriage application ${id}`, req.ip);

    res.json({ success: true, message: 'Marriage application rejected and removed from registry queue.' });
  } catch (err) { next(err); }
};
