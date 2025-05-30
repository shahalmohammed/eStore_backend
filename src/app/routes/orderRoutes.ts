import { Router } from 'express';
import { createOrder,getOrder } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.post('/get-order', getOrder);


export default router;
