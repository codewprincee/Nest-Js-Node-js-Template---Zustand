import { Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { updateFcmToken, removeFcmToken } from '../controllers/authController';

const router = Router();

// FCM token operations - accessible by any authenticated user
router.put('/fcm-token', auth, updateFcmToken);
router.delete('/fcm-token', auth, removeFcmToken);

// Admin-only route example
router.get('/admin/users', auth, authorize([UserRole.ADMIN]), (req, res) => {
  // Admin-only logic here
  res.json({ message: 'Admin access granted' });
});

export default router; 