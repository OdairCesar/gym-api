import express from 'express'
import {
  createDiet,
  getAllDiets,
  getDiet,
  getDietById,
  updateDiet,
} from '../controllers/dietController'
import { protect } from '../middleware/authMiddleware'

const router = express.Router()

router.post('/diet', protect, createDiet)
router.get('/diet', protect, getAllDiets)
router.get('/diet/me', protect, getDiet)
router.get('/diet/:id', protect, getDietById)
router.put('/diet/:id', protect, updateDiet)

export default router
