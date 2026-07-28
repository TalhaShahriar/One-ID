import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
import { 
  registerTaxProfile, 
  getMyTaxProfile, 
  calculateTax, 
  submitTaxReturn, 
  payTax, 
  getMyReceipt,
  downloadTinCertificate, 
  getAllReturns, 
  flagAnomaly 
} from './tax.controller.js';
import { generateTaxReceiptPDF } from './pdf/generateTaxReceiptPDF.js';
import { prisma } from '../../prisma.js';

const router = Router();

// Citizen Routes
router.post('/register', authenticateJWT, registerTaxProfile);
router.get('/profile', authenticateJWT, getMyTaxProfile);
router.post('/calculate', authenticateJWT, calculateTax);
router.post('/submit', authenticateJWT, submitTaxReturn);
router.post('/pay', authenticateJWT, payTax);
router.get('/receipt/:receiptNumber', authenticateJWT, getMyReceipt);
router.get('/tin/certificate', authenticateJWT, downloadTinCertificate);

// PDF Generation Endpoint (POST as requested, but we can also allow GET for ease of download)
const servePdf = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;
    const taxReturn = await prisma.taxReturn.findUnique({
      where: { receiptNumber },
      include: {
        taxProfile: {
          include: {
            citizen: {
              select: { name: true, oneid: true, email: true, phone: true }
            }
          }
        }
      }
    });

    if (!taxReturn) {
      return res.status(404).json({ error: 'Filing Receipt Details not discovered in platform nodes.' });
    }

    const pdfBytes = await generateTaxReceiptPDF(taxReturn);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=NBR_Receipt_${receiptNumber}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    next(err);
  }
};

router.post('/receipt/:receiptNumber/pdf', servePdf);
router.get('/receipt/:receiptNumber/pdf', servePdf);

// Admin Routes (TAX_ADMIN or SUPER_ADMIN)
router.get('/admin/returns', authenticateJWT, authorizeRoles('TAX_ADMIN', 'SUPER_ADMIN'), getAllReturns);
router.post('/admin/flag', authenticateJWT, authorizeRoles('TAX_ADMIN', 'SUPER_ADMIN'), flagAnomaly);

export default router;
