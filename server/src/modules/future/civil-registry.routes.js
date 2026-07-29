import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
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
  getMyBirthRecords,
  getMyDeathRecords,
  getBirthCertificate,
  getDeathCertificate,
  applyMarriage,
  getMarriageApplications,
  approveMarriageApplication,
  rejectMarriageApplication
} from './civil.controller.js';

const router = Router();

router.get('/summary', authenticateJWT, (req, res) => {
  res.json({
    module: 'civil-registry',
    status: 'active',
    features: ['Sovereign Dual-Signed Nikah Naama', 'Birth Certificate Generation', 'Death Certificate Generation', '90-Day Talaq Wait State-Machine', 'Bigamy Prevention'],
    citizenId: req.user.oneid || 'N/A'
  });
});

router.get('/verify-oneid/:oneid', authenticateJWT, verifyOneID);
router.post('/marriage', authenticateJWT, registerMarriage);
router.get('/my-marriage', authenticateJWT, getMyMarriageStatus);
router.post('/divorce/notice', authenticateJWT, filingTalaqNotice);
router.post('/divorce/arbitration/setup', authenticateJWT, authorizeRoles('LOCAL_AUTHORITY_ADMIN', 'CIVIL_REGISTRY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), formArbitrationCouncil);
router.post('/divorce/arbitration/log', authenticateJWT, authorizeRoles('LOCAL_AUTHORITY_ADMIN', 'CIVIL_REGISTRY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), logReconciliationAttempt);
router.post('/divorce/reconcile', authenticateJWT, authorizeRoles('LOCAL_AUTHORITY_ADMIN', 'CIVIL_REGISTRY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), reconcileMarriage);
router.post('/divorce/finalize', authenticateJWT, authorizeRoles('LOCAL_AUTHORITY_ADMIN', 'CIVIL_REGISTRY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), finalizeDivorce);
router.get('/admin/proceedings', authenticateJWT, authorizeRoles('LOCAL_AUTHORITY_ADMIN', 'KAZI_ADMIN', 'CIVIL_REGISTRY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), getAdminProceedings);
router.get('/public/verify/:elementId', verifyCertificate);

router.post('/birth', authenticateJWT, registerBirth);
router.get('/birth', authenticateJWT, getMyBirthRecords);
router.get('/birth/:id', authenticateJWT, getBirthCertificate);

router.post('/death', authenticateJWT, registerDeath);
router.get('/death', authenticateJWT, getMyDeathRecords);
router.get('/death/:id', authenticateJWT, getDeathCertificate);

router.post('/marriage/apply', authenticateJWT, applyMarriage);
router.get('/marriage/applications', authenticateJWT, getMarriageApplications);
router.post('/marriage/applications/:id/approve', authenticateJWT, authorizeRoles('KAZI_ADMIN', 'CIVIL_REGISTRY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), approveMarriageApplication);
router.delete('/marriage/applications/:id/reject', authenticateJWT, authorizeRoles('KAZI_ADMIN', 'CIVIL_REGISTRY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), rejectMarriageApplication);

export default router;

