import { Request, Response } from 'express';
import ProductModel from '../model/ProductModel';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.getAll();
    res.json(products);
  } catch (err) {
    console.error('Error in getAllProducts:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await ProductModel.getById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(product);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, base_price, image, variants } = req.body;

    if (!title || !base_price || !variants || !Array.isArray(variants)) {
      res.status(400).json({ error: 'Missing required fields: title, base_price, variants' });
      return;
    }

    await ProductModel.create({
      title,
      description,
      base_price,
      image,
      variants
    });

    res.status(201).json({ message: 'Product created successfully' });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

