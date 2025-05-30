import express from 'express';
import productRoutes from '../app/routes/productRoutes';
import orderRoutes from '../app/routes/orderRoutes';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// ✅ DO THIS — DON'T CALL productRoutes()
app.use('/v1/products', productRoutes);
app.use('/v1/orders', orderRoutes);

export default app;
