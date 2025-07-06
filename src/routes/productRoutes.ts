import { Router } from 'express'
import {
  createProduct,
  updateProduct,
  getProductById,
  getAllProducts,
} from '../controllers/productController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.post('/product', protect, createProduct)
router.put('/product/:id', protect, updateProduct)
router.get('/product/:id', getProductById)
router.get('/product', getAllProducts)

export default router
