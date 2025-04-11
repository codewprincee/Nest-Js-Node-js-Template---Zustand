import { Router } from 'express';
import v1Routes from './v1';

const router = Router();

// API version 1 routes
router.use('/v1', v1Routes);

// For future versions, you can add them here
// router.use('/v2', v2Routes);

// By default, use the latest version
router.use('/', v1Routes);

export default router; 