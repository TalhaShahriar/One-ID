import { Router } from 'express';
import { authenticateJWT } from '../../core/auth.middleware.js';
import {
  verifyOneID,
  registerMarriage,
  getMyMarriageStatus,
  filingTalaqNotice,
  formArbitrationCouncil,
  logReconciliationAttempt,
  reconcileMarriage,
  finalizeDivorce,
  verifyCertificate,
  getAdminProceedings,
  registerBirth,
  registerDeath,
  applyMarriage
} from './civil.controller.js';

const router = Router();

router.get('/summary', authenticateJWT, (req, res) => {
  res.json({
    module: 'civil-registry',
    status: 'active',
    features: ['Sovereign Dual-Signed Nikah Naama', '90-Day Talaq Wait State-Machine', 'Bigamy Prevention'],
    citizenId: req.user.oneid || 'N/A'
  });
});

router.get('/verify-oneid/:oneid', authenticateJWT, verifyOneID);
router.post('/marriage', authenticateJWT, registerMarriage);
router.get('/my-marriage', authenticateJWT, getMyMarriageStatus);
router.post('/divorce/notice', authenticateJWT, filingTalaqNotice);
router.post('/divorce/arbitration/setup', authenticateJWT, formArbitrationCouncil);
router.post('/divorce/arbitration/log', authenticateJWT, logReconciliationAttempt);
router.post('/divorce/reconcile', authenticateJWT, reconcileMarriage);
router.post('/divorce/finalize', authenticateJWT, finalizeDivorce);
router.get('/admin/proceedings', authenticateJWT, getAdminProceedings);
router.get('/public/verify/:elementId', verifyCertificate);

router.post('/birth', authenticateJWT, registerBirth);
router.post('/death', authenticateJWT, registerDeath);

router.post('/marriage/apply', authenticateJWT, applyMarriage);
export default router;

