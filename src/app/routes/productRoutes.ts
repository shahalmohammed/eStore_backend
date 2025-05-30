import { Router, Request, Response } from 'express';
import { getAllProducts, getProductById, createProduct } from '../controllers/productController';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById); 
router.post('/', createProduct); 

export default router;
