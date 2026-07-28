import { generateTinCertificatePDF } from './pdf/generateTinCertificatePDF.js';

import { prisma } from '../../prisma.js';
import { append as appendLedgerRecord } from '../../core/ledger.engine.js';
import { createTransporter } from '../../shared/email.service.js';
import { logEvent } from '../../core/audit.service.js';

export const registerTaxProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId, 10) } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (!user.oneid) {
      return res.status(400).json({ error: 'Account missing OneID.' });
    }

    const existing = await prisma.taxProfile.findUnique({
      where: { citizenOneId: user.oneid }
    });
    if (existing) {
      return res.status(409).json({ error: 'You already have a tax profile.' });
    }

    const twoDigitYear = String(new Date().getFullYear()).slice(-2);
    const randomFive = String(Math.floor(10000 + Math.random() * 90000));
    const tin = `TIN${twoDigitYear}${randomFive}`;

    const profile = await prisma.taxProfile.create({
      data: {
        citizenOneId: user.oneid,
        tin
      }
    });

    await logEvent(
      req.user.userId,
      'TAX_PROFILE_REGISTERED',
      `Registered tax profile under OneID: ${user.oneid}. Assigned TIN: ${tin}`,
      req.ip
    );

    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
};

export const getMyTaxProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId, 10) } });
    if (!user || !user.oneid) {
      return res.json(null);
    }

    const profile = await prisma.taxProfile.findUnique({
      where: { citizenOneId: user.oneid },
      include: {
        returns: {
          orderBy: { taxYear: 'desc' }
        }
      }
    });

    res.json(profile);
  } catch (err) {
    next(err);
  }
};

export const calculateTax = async (req, res, next) => {
  try {
    const { grossIncome, taxYear, gender, dateOfBirth, residencyType } = req.body;

    let targetGender = gender;
    let targetDOB = dateOfBirth;

    if (!targetGender || !targetDOB) {
      const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId, 10) } });
      if (user) {
        if (!targetGender) targetGender = 'MALE';
        if (!targetDOB) targetDOB = user.dateOfBirth || '1990-01-01';
      }
    }

    const incomeVal = parseFloat(grossIncome) || 0;
    const dobObj = new Date(targetDOB);
    const today = new Date();
    let age = today.getFullYear() - dobObj.getFullYear();
    const m = today.getMonth() - dobObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobObj.getDate())) {
      age--;
    }

    const isSenior = age >= 65;
    const isWoman = targetGender && ['FEMALE', 'WOMEN', 'WOMAN'].includes(targetGender.toUpperCase());

    const threshold = 400000;

    const slabs = [
      { limit: threshold, rate: 0, label: `First BDT ${threshold.toLocaleString()} (Tax-free threshold)` },
      { limit: 100000, rate: 5, label: 'Next BDT 1,00,000' },
      { limit: 300000, rate: 10, label: 'Next BDT 3,00,000' },
      { limit: 400000, rate: 15, label: 'Next BDT 4,00,000' },
      { limit: 500000, rate: 20, label: 'Next BDT 5,00,000' },
      { limit: Infinity, rate: 25, label: 'Remaining Balance' }
    ];

    let tempIncome = incomeVal;
    let totalCalculatedTax = 0;
    const breakdown = [];

    for (const slab of slabs) {
      if (tempIncome <= 0) {
        breakdown.push({
          slab: slab.label,
          rate: slab.rate,
          amount: 0
        });
        continue;
      }

      const taxableAmountInSlab = Math.min(tempIncome, slab.limit);
      const taxInSlab = (taxableAmountInSlab * slab.rate) / 100;
      totalCalculatedTax += taxInSlab;
      tempIncome -= taxableAmountInSlab;

      breakdown.push({
        slab: slab.label,
        rate: slab.rate,
        amount: taxInSlab
      });
    }

    let minimumTax = 2000;
    if (residencyType && (
      residencyType.toUpperCase().includes('DHAKA') || 
      residencyType.toUpperCase().includes('CTG') || 
      residencyType.toUpperCase().includes('CHITTAGONG') || 
      residencyType.toUpperCase().includes('CORPORATION')
    )) {
      minimumTax = 5000;
    }

    const finalTax = totalCalculatedTax > 0 ? Math.max(totalCalculatedTax, minimumTax) : 0;

    res.json({
      grossIncome: incomeVal,
      taxableIncome: incomeVal,
      calculatedTax: totalCalculatedTax,
      minimumTax,
      finalTax,
      breakdown
    });
  } catch (err) {
    next(err);
  }
};

export const submitTaxReturn = async (req, res, next) => {
  try {
    const { taxYear, grossIncome, gender, residencyType } = req.body;
    const yearParsed = parseInt(taxYear);
    const incomeVal = parseFloat(grossIncome) || 0;

    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId, 10) } });
    if (!user || !user.oneid) {
      return res.status(400).json({ error: 'Account not found or missing OneID.' });
    }

    const profile = await prisma.taxProfile.findUnique({
      where: { citizenOneId: user.oneid }
    });
    if (!profile) {
      return res.status(400).json({ error: 'No tax profile found. Please register one first.' });
    }

    const existing = await prisma.taxReturn.findUnique({
      where: {
        taxProfileId_taxYear: {
          taxProfileId: profile.id,
          taxYear: yearParsed
        }
      }
    });
    if (existing) {
      return res.status(409).json({ error: `A tax return has already been filed for tax year ${yearParsed}.` });
    }

    // Server-side calculation
    const dob = user.dateOfBirth || new Date('1990-01-01');
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    const isSenior = age >= 65;
    const targetGender = gender || 'MALE';
    const isWoman = ['FEMALE', 'WOMEN', 'WOMAN'].includes(targetGender.toUpperCase());

    const threshold = 400000;

    const slabs = [
      { limit: threshold, rate: 0 },
      { limit: 100000, rate: 5 },
      { limit: 300000, rate: 10 },
      { limit: 400000, rate: 15 },
      { limit: 500000, rate: 20 },
      { limit: Infinity, rate: 25 }
    ];

    let tempIncome = incomeVal;
    let totalCalculatedTax = 0;

    for (const slab of slabs) {
      if (tempIncome <= 0) break;
      const taxableAmountInSlab = Math.min(tempIncome, slab.limit);
      const taxInSlab = (taxableAmountInSlab * slab.rate) / 100;
      totalCalculatedTax += taxInSlab;
      tempIncome -= taxableAmountInSlab;
    }

    let minimumTax = 2000;
    if (residencyType && (
      residencyType.toUpperCase().includes('DHAKA') || 
      residencyType.toUpperCase().includes('CTG') || 
      residencyType.toUpperCase().includes('CHITTAGONG') || 
      residencyType.toUpperCase().includes('CORPORATION')
    )) {
      minimumTax = 5000;
    }

    const finalTax = totalCalculatedTax > 0 ? Math.max(totalCalculatedTax, minimumTax) : 0;

    let anomalyFlag = false;
    let anomalyReason = null;

    const previousReturn = await prisma.taxReturn.findFirst({
      where: {
        taxProfileId: profile.id,
        taxYear: yearParsed - 1
      }
    });

    if (previousReturn) {
      const dropRatio = (previousReturn.grossIncome - incomeVal) / previousReturn.grossIncome;
      if (dropRatio > 0.40) {
        anomalyFlag = true;
        anomalyReason = `Gross Income dropped by ${(dropRatio * 100).toFixed(1)}% compared to BDT ${previousReturn.grossIncome.toLocaleString()} in tax year ${yearParsed - 1}`;
      }
    }

    const returnsCount = await prisma.taxReturn.count({
      where: { taxProfileId: profile.id }
    });

    if (incomeVal > 10000000) {
      anomalyFlag = true;
      anomalyReason = `Gross income exceeds BDT 10,000,000 (BDT ${incomeVal.toLocaleString()}). Required mandatory audit review.`;
    }

    const ledgerRecord = await appendLedgerRecord('TAX', {
      oneId: user.oneid,
      taxYear: yearParsed,
      grossIncome: incomeVal,
      finalTax,
      tin: profile.tin,
      integrityProof: 'NBR-SHA256'
    }, prisma);

    const receiptNumber = `RCP-${yearParsed}-${Math.floor(100000 + Math.random() * 900000)}`;

    const taxReturn = await prisma.taxReturn.create({
      data: {
        taxProfileId: profile.id,
        taxYear: yearParsed,
        grossIncome: incomeVal,
        taxableIncome: incomeVal,
        calculatedTax: totalCalculatedTax,
        minimumTax,
        finalTax,
        paymentStatus: 'UNPAID',
        receiptNumber,
        ledgerRecordId: ledgerRecord.id,
        anomalyFlag,
        anomalyReason
      }
    });

    await logEvent(
      req.user.userId,
      'TAX_RETURN_SUBMITTED',
      `Submitted e-file return for year ${yearParsed}. Receipt: ${receiptNumber}. Ledger hash sequence assigned. Anomaly: ${anomalyFlag}`,
      req.ip
    );

    res.status(201).json(taxReturn);
  } catch (err) {
    next(err);
  }
};

export const payTax = async (req, res, next) => {
  try {
    const { returnId, amount } = req.body;

    const taxReturn = await prisma.taxReturn.findUnique({
      where: { id: returnId },
      include: {
        taxProfile: {
          include: {
            citizen: true
          }
        }
      }
    });

    if (!taxReturn) {
      return res.status(404).json({ error: 'Tax return record not found.' });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId, 10) } });
    if (taxReturn.taxProfile.citizenOneId !== user.oneid) {
      return res.status(403).json({ error: 'You are not authorized to pay this tax return.' });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId, 10) } });
    if (taxReturn.taxProfile.citizenOneId !== user.oneid) {
      return res.status(403).json({ error: 'You are not authorized to pay this tax return.' });
    }

    if (parseFloat(amount) < taxReturn.finalTax) {
      return res.status(400).json({ error: `Insufficient payment. Required amount is BDT ${taxReturn.finalTax.toLocaleString()}.` });
    }

    const updated = await prisma.taxReturn.update({
      where: { id: returnId },
      data: {
        paymentStatus: 'PAID',
        paidAmount: parseFloat(amount),
        paidAt: new Date()
      }
    });

    await logEvent(
      taxReturn.taxProfile.citizen.id,
      'TAX_PAYMENT_COMPLETED',
      `Paid BDT ${amount} for Tax Year ${taxReturn.taxYear}. Status set to PAID.`,
      req.ip
    );

    // Send confirmation email
    const transporter = createTransporter();
    const citizenEmail = taxReturn.taxProfile.citizen.email;

    if (transporter && citizenEmail) {
      const emailBody = `
        <div style="font-family: Arial, sans-serif; padding: 30px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2 style="color: #15803d; margin-top: 0;">National Board of Revenue — OneID Bangladesh</h2>
          <p style="font-size: 15px; font-weight: bold;">Dear Citizen ${taxReturn.taxProfile.citizen.name},</p>
          <p>We are pleased to confirm your tax payment on the unified OneID Portal for the tax year <strong>${taxReturn.taxYear}</strong> has been processed successfully.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Receipt Number:</strong></td>
              <td style="padding: 6px 0; text-align: right; font-mono;">${taxReturn.receiptNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>TIN:</strong></td>
              <td style="padding: 6px 0; text-align: right;">${taxReturn.taxProfile.tin}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Tax Year:</strong></td>
              <td style="padding: 6px 0; text-align: right;">${taxReturn.taxYear}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Amount Paid:</strong></td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #166534;">BDT ${parseFloat(amount).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Blockchain Proof:</strong></td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 11px;">${taxReturn.ledgerRecordId}</td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 11px; color: #64748b; text-align: center;">This is a system-generated cryptographic receipt issued by the Government of Bangladesh. You can verify this anytime inside the OneID portal.</p>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: `"NBR Income Tax Office" <${process.env.EMAIL_USER}>`,
          to: citizenEmail,
          subject: `✅ Successful Tax Payment Confirmation — Year ${taxReturn.taxYear}`,
          html: emailBody
        });
      } catch (mailErr) {
        console.error('Error sending tax payment success confirmation mail:', mailErr);
      }
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const getMyReceipt = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;

    const taxReturn = await prisma.taxReturn.findUnique({
      where: { receiptNumber },
      include: {
        taxProfile: {
          include: {
            citizen: {
              select: { name: true, email: true, phone: true }
            }
          }
        }
      }
    });

    if (!taxReturn) {
      return res.status(404).json({ error: 'Receipt record could not be found.' });
    }

    res.json(taxReturn);
  } catch (err) {
    next(err);
  }
};

export const getAllReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, taxYear, paymentStatus, anomalyFlag } = req.query;

    const where = {};
    if (taxYear) {
      where.taxYear = parseInt(taxYear);
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    if (anomalyFlag !== undefined) {
      where.anomalyFlag = anomalyFlag === 'true';
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const total = await prisma.taxReturn.count({ where });
    const returns = await prisma.taxReturn.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        taxProfile: {
          include: {
            citizen: {
              select: { name: true, oneid: true, email: true }
            }
          }
        }
      }
    });

    res.json({
      returns,
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

export const flagAnomaly = async (req, res, next) => {
  try {
    const { returnId, reason } = req.body;

    if (!returnId || !reason) {
      return res.status(400).json({ error: 'returnId and reason parameters are mandatory.' });
    }

    const updated = await prisma.taxReturn.update({
      where: { id: returnId },
      data: {
        anomalyFlag: true,
        anomalyReason: reason
      }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};



export const downloadTinCertificate = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.userId, 10) } });
    const profile = await prisma.taxProfile.findUnique({
      where: { citizenOneId: user.oneid }
    });

    if (!profile) return res.status(404).json({ error: 'Tax profile not found' });

    const pdfBuffer = await generateTinCertificatePDF({
      tin: profile.tin,
      tinIssuedAt: profile.tinIssuedAt,
      taxpayerName: user.name,
      oneId: user.oneid,
      paymentStatus: 'ACTIVE',
      ledgerHash: 'TIN-CERTIFICATE',
      createdAt: new Date()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TIN_Certificate_${profile.tin}.pdf`);
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
