import { Router } from 'express'
import {
  getUser,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserById,
} from '../controllers/userController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/user', protect, getUsers)
router.get('/user/:id', protect, getUserById)
router.post('/user', createUser)
router.put('/user/:id', protect, updateUserById)
router.put('/user/me', protect, updateUser)
router.get('/user/me', protect, getUser)

export default router
