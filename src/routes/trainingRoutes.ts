// src/routes/authRoutes.ts
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { postTraining, putTraining, getTraining } from '../controllers/trainingController';

const router = express.Router();

router.get('/training', protect, getTraining);

router.get('/training/:id', protect, getTraining);

router.post('/training', protect, postTraining);

router.put('/training', protect, putTraining);


export default router;
