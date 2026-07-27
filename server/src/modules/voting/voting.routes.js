import { Router } from 'express';
import electionsRouter from './elections.routes.js';
import candidatesRouter from './candidates.routes.js';
import votesRouter from './votes.routes.js';
import auditRouter from './audit.routes.js';
import anomalyRouter from './anomaly.routes.js';
import reportsRouter from './reports.routes.js';

const router = Router();

// Mount sub-routers on standard sub-paths
router.use('/elections', electionsRouter);
router.use('/candidates', candidatesRouter);
router.use('/votes', votesRouter);
router.use('/audit', auditRouter);
router.use('/anomaly', anomalyRouter);
router.use('/reports', reportsRouter);

export default router;
