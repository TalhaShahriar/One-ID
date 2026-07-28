import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../../core/auth.middleware.js';
import {
  registerProperty,
  getMyProperties,
  getPropertyHistory,
  flagDispute,
  initiateTransfer,
  buyerConfirmTransfer,
  adminApproveTransfer,
  cancelTransfer,
  getAllProperties
} from './property.controller.js';

const router = Router();

// Public Property verification trail
router.get('/:propertyId/history', getPropertyHistory);

// Citizen Property portfolio & actions (Needs login)
router.post('/register', authenticateJWT, registerProperty);
router.get('/mine', authenticateJWT, getMyProperties);
router.post('/transfer/initiate', authenticateJWT, initiateTransfer);
router.post('/transfer/confirm', authenticateJWT, buyerConfirmTransfer);
router.post('/transfer/cancel', authenticateJWT, cancelTransfer);

// Ministry land admin actions (Needs PROPERTY_ADMIN or ADMIN role)
router.get('/admin/all', authenticateJWT, authorizeRoles('PROPERTY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), getAllProperties);
router.post('/admin/dispute', authenticateJWT, authorizeRoles('PROPERTY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), flagDispute);
router.post('/admin/approve', authenticateJWT, authorizeRoles('PROPERTY_ADMIN', 'ADMIN', 'SUPER_ADMIN'), adminApproveTransfer);

export default router;
