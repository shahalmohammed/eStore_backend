import db from '../../config/db';

export interface OrderItem {
  product_id: number;
  variant_name: string;
  variant_value: string;
  quantity: number;
  price: number;
}

export interface Order {
  order_number: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  total_price: number;
  status: 'approved' | 'declined' | 'error';
  items: OrderItem[];
}

const OrderModel = {
  async create(order: Order): Promise<void> {
    const {
      order_number,
      name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      total_price,
      status,
      items
    } = order;

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [orderResult]: any = await conn.query(
        `INSERT INTO orders 
        (order_number, name, email, phone, address, city, state, zip_code, total_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_number,
          name,
          email,
          phone,
          address,
          city,
          state,
          zip_code,
          total_price,
          status
        ]
      );

      const orderId = orderResult.insertId;

      for (const item of items) {
        await conn.query(
          `INSERT INTO order_items 
          (order_id, product_id, variant_name, variant_value, quantity, price_per_item, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.variant_name,
            item.variant_value,
            item.quantity,
            item.price,
            item.price * item.quantity
          ]
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async getByOrderNumber(order_number: string): Promise<any> {
    const conn = await db.getConnection();

    try {
      const [orders]: any = await conn.query(
        `SELECT * FROM orders WHERE order_number = ?`,
        [order_number]
      );

      if (!orders || orders.length === 0) return null;

      const order = orders[0];

      const [items]: any = await conn.query(
        `SELECT 
          order_items.*, 
          products.title AS product_title,
          products.image AS product_image
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        WHERE order_id = ?`,
        [order.id]
      );

      return {
        ...order,
        items
      };
    } finally {
      conn.release();
    }
  }
};

export default OrderModel;
