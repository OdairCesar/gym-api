import { Router } from 'express';
import { getUser, getUsers, updateUser, updateOtherUser, changePassword } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/user', protect, getUsers);
router.put('/user:id', protect, updateOtherUser); 
router.put('/user/me', protect, updateUser); 
router.get('/user/me', protect, getUser);
router.post('/user/change-password', protect, changePassword);

export default router;
