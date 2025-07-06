import { Router } from 'express'
import {
  getUser,
  getUsers,
  createUser,
  updateUser,
  updateOtherUser,
} from '../controllers/userController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/user', protect, getUsers)
router.put('/user/:id', protect, updateOtherUser)
router.post('/user', createUser)
router.put('/user/me', protect, updateUser)
router.get('/user/me', protect, getUser)

export default router
