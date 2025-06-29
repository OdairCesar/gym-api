import { Router } from 'express';
import { getUser, getUsers, updateUser, changePassword } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/users', protect, getUsers);
router.put('/users', protect, updateUser); 
router.get('/users/me', protect, getUser);
router.post('/users/change-password', protect, changePassword);

export default router;
