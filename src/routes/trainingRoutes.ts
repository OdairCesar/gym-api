import express from 'express'

import { protect } from '../middleware/authMiddleware'

import {
  postTraining,
  putTraining,
  getTraining,
  getAllTrainings,
  getTrainingById,
} from '../controllers/trainingController'

const router = express.Router()

router.post('/training', protect, postTraining)
router.get('/training', protect, getAllTrainings)
router.get('/training/me', protect, getTraining)
router.get('/training/:id', protect, getTrainingById)
router.put('/training/:id', protect, putTraining)

export default router
