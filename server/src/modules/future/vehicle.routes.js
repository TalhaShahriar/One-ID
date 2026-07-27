import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
import {
  applyForLicense,
  approveLicense,
  registerVehicle,
  getMyVehicles,
  getVehicleHistory,
  initiateTransfer,
  buyerAcceptTransfer,
  adminCompleteTransfer,
  recordViolation,
  payRoadTax,
  payViolation,
  getAdminOverviewList,
  lookupBuyer
} from './vehicle.controller.js';

const router = Router();

// Public tracing endpoint - no login context needed! (Key Viva demo)
router.get('/:registrationNo/history', getVehicleHistory);

// Citizen authenticated routes
router.get('/lookup-buyer/:toOwnerOneId', authenticateJWT, lookupBuyer);
router.get('/my-data', authenticateJWT, getMyVehicles);
router.post('/license/apply', authenticateJWT, applyForLicense);
router.post('/register', authenticateJWT, registerVehicle);
router.post('/transfer/initiate', authenticateJWT, initiateTransfer);
router.post('/transfer/accept', authenticateJWT, buyerAcceptTransfer);
router.post('/road-tax/pay', authenticateJWT, payRoadTax);
router.post('/violation/pay', authenticateJWT, payViolation);

// Admin dedicated routes (VEHICLE_ADMIN or general system ADMIN)
router.get('/admin/overview', authenticateJWT, authorizeRoles('VEHICLE_ADMIN', 'ADMIN', 'SUPER_ADMIN'), getAdminOverviewList);
router.post('/admin/license/approve', authenticateJWT, authorizeRoles('VEHICLE_ADMIN', 'ADMIN', 'SUPER_ADMIN'), approveLicense);
router.post('/admin/transfer/complete', authenticateJWT, authorizeRoles('VEHICLE_ADMIN', 'ADMIN', 'SUPER_ADMIN'), adminCompleteTransfer);
router.post('/admin/violation/record', authenticateJWT, authorizeRoles('VEHICLE_ADMIN', 'ADMIN', 'SUPER_ADMIN'), recordViolation);

export default router;
