import express from 'express'
import { changePassword, loginUser } from '../controllers/authController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

router.post('/login', loginUser)
router.post('/user/change-password', protect, changePassword)

export default router
