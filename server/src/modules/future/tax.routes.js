import { Router } from 'express';
import { authenticateJWT } from '../../core/auth.middleware.js';

const router = Router();

router.get('/summary', authenticateJWT, (req, res) => {
  res.json({
    module: 'tax',
    status: 'planned',
    features: ['Income Tax Filing', 'Tax Clearance Certificate', 'Property Tax Assessment'],
    citizenId: req.user.oneid || 'N/A',
    description: 'This module will handle automated taxation and e-filing for citizens of Bangladesh under OneID.'
  });
});

export default router;
