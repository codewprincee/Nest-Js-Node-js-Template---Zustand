import { Router } from 'express';
import { authController } from '../../controllers';
import { authMiddleware } from '../../middlewares';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware.protect, authController.logoutUser);
router.get('/me', authMiddleware?.protect, authController.getMe);
router.put('/fcm-token', authMiddleware?.protect, authController.updateFcmToken);
router.delete('/fcm-token', authMiddleware?.protect, authController.removeFcmToken);

export default router; 