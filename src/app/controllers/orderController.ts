import { Request, Response } from 'express';
import OrderModel from '../model/OrderModel';
import ProductModel from '../model/ProductModel';
import sendEmail from '../services/mailService';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const {
        name, email, phone, address, city, state, zip_code,
        cardNumber, items,
        totalAmount, 
        taxAmount,
        shippingCost
    } = req.body;

    const order_number = 'ORD-' + Date.now();

    try {
        if (
            !name || !email || !phone || !address || !city || !state || !zip_code ||
            !cardNumber || !Array.isArray(items) || items.length === 0 ||
            totalAmount === undefined || taxAmount === undefined || shippingCost === undefined 
        ) {
            res.status(400).json({ error: 'Missing required fields or items' });
            return;
        }

        const cleanCard = cardNumber.replace(/\s/g, '');
        let status: 'approved' | 'declined' | 'error';
        switch (cleanCard) {
            case '1111111111111111': status = 'approved'; break;
            case '2222222222222222': status = 'declined'; break;
            case '3333333333333333': status = 'error'; break;
            default:
                res.status(400).json({ error: 'Invalid or unsupported card number' });
                return;
        }

        let calculated_subtotal_price = 0;
        const orderItems: any[] = [];

        const productMap: { [productId: number]: any } = {};
        const uniqueProductIds = [...new Set(items.map((item: any) => item.productId))];

        for (const id of uniqueProductIds) {
            const product = await ProductModel.getById(id);
            if (!product) {
                res.status(404).json({ error: `Product not found: ${id}` });
                return;
            }
            productMap[id] = product;
        }

        for (const item of items) {
            const { productId, variants, quantity } = item;

            if (!productId || !Array.isArray(variants) || variants.length === 0 || !quantity) {
                res.status(400).json({ error: 'Each item must have productId, variants, and quantity' });
                return;
            }

            const product = productMap[productId];

            const matchedVariant = product.variants.find((v: any) =>
                variants.some((variant: any) => v.name === variant.name && v.value === variant.value)
            );

            if (!matchedVariant) {
                res.status(404).json({ error: `Variant not found for product ${product.title}` });
                return;
            }
            if (status === 'approved') {
                await ProductModel.updateVariantStock(productId, matchedVariant.name, matchedVariant.value, quantity);
            }

            const itemSubtotal = product.base_price * quantity;
            calculated_subtotal_price += itemSubtotal;

            orderItems.push({
                product_id: productId,
                variant_name: variants.map((v: any) => v.name).join(', '),
                variant_value: variants.map((v: any) => v.value).join(', '),
                quantity,
                price: product.base_price
            });
        }

        await OrderModel.create({
            order_number,
            name,
            email,
            phone,
            address,
            city,
            state,
            zip_code,
            total_price: parseFloat(totalAmount),
            status,
            items: orderItems
        });
        await sendEmail({
            email,
            name,
            order_number,
            total_price: parseFloat(totalAmount),
            tax_amount: parseFloat(taxAmount),
            shipping_cost: parseFloat(shippingCost),
            status,
            products: orderItems.map(item => {
                const product = productMap[item.product_id];
                const image = product.variants.find((v: any) =>
                    item.variant_name.includes(v.name) && item.variant_value.includes(v.value)
                )?.image || '';
                return {
                    title: product.title,
                    image,
                    variant: `${item.variant_name}: ${item.variant_value}`,
                    quantity: item.quantity,
                    price: item.price
                };
            })
        });

        res.status(201).json({ order_number, status });

    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Order processing failed' });
    }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
    const { order_number } = req.body;

    if (!order_number) {
        res.status(400).json({ error: 'Order number is required' });
        return;
    }

    try {
        const order = await OrderModel.getByOrderNumber(order_number);
        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.status(200).json(order);
    } catch (err) {
        console.error('Error retrieving order:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
