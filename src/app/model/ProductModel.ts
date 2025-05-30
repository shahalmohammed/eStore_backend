import db from '../../config/db';
import { RowDataPacket } from 'mysql2';

interface Variant {
  name: string;
  value: string;
  price: number;
  stock: number;
  image: string | null;
}

interface Product {
  id: number;
  title: string;
  description: string;
  base_price: number;
  image: string | null;
  created_at: string;
  updated_at: string;
  variants: Variant[];
}

const ProductModel = {
  async getAll(): Promise<Product[]> {
    const [productsRows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM products`
    );

    const productMap: Record<number, Product> = {};
    for (const row of productsRows) {
      productMap[row.id] = {
        id: row.id,
        title: row.title,
        description: row.description,
        base_price: row.base_price,
        image: row.image,
        created_at: row.created_at,
        updated_at: row.updated_at,
        variants: [],
      };
    }

    const [variantRows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM product_variants`
    );

    for (const variant of variantRows) {
      const product = productMap[variant.product_id];
      if (product) {
        product.variants.push({
          name: variant.variant_name,
          value: variant.variant_value,
          price: variant.price,
          stock: variant.stock,
          image: variant.image,
        });
      }
    }

    return Object.values(productMap);
  },

  async getById(id: number): Promise<Product | null> {
    const [productRows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );
    if (productRows.length === 0) return null;

    const product: Product = {
      id: productRows[0].id,
      title: productRows[0].title,
      description: productRows[0].description,
      base_price: productRows[0].base_price,
      image: productRows[0].image,
      created_at: productRows[0].created_at,
      updated_at: productRows[0].updated_at,
      variants: [],
    };

    const [variantRows] = await db.query<RowDataPacket[]>(
      `SELECT * FROM product_variants WHERE product_id = ?`,
      [id]
    );

    product.variants = variantRows.map((variant) => ({
      name: variant.variant_name,
      value: variant.variant_value,
      price: variant.price,
      stock: variant.stock,
      image: variant.image,
    }));

    return product;
  },
async create(productData: {
  title: string;
  description?: string;
  base_price: number;
  image?: string;
  variants: {
    name: string;
    value: string;
    price: number;
    stock: number;
    image?: string | null;
  }[];
}): Promise<void> {
  const { title, description = '', base_price, image = null, variants } = productData;

  const [result] = await db.query('INSERT INTO products (title, description, base_price, image) VALUES (?, ?, ?, ?)', [title, description, base_price, image]);
  const productId = (result as any).insertId;

  for (const variant of variants) {
    await db.query(
      'INSERT INTO product_variants (product_id, variant_name, variant_value, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, variant.name, variant.value, variant.price, variant.stock, variant.image || null]
    );
  }
},
  async updateVariantStock(
    productId: number,
    variantName: string,
    variantValue: string,
    quantity: number
  ): Promise<void> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT stock FROM product_variants WHERE product_id = ? AND variant_name = ? AND variant_value = ?`,
      [productId, variantName, variantValue]
    );

    if (rows.length === 0) {
      throw new Error('Variant not found');
    }

    const stock = rows[0].stock;
    if (stock < quantity) {
      throw new Error(`Not enough stock for variant ${variantValue}`);
    }

    await db.query(
      `UPDATE product_variants SET stock = stock - ? WHERE product_id = ? AND variant_name = ? AND variant_value = ?`,
      [quantity, productId, variantName, variantValue]
    );
  },
};

export default ProductModel;
