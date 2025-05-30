import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

interface MailOptions {
    email: string;
    name: string;
    order_number: string;
    total_price: number; // This will now represent the grand total
    tax_amount: number; // New: Tax amount
    shipping_cost: number; // New: Shipping cost
    status: 'approved' | 'declined' | 'error';
    products: {
        title: string;
        image: string;
        variant: string;
        quantity: number;
        price: number;
    }[];
}

const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>eShop Order Update</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Reset and base styles */
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      background-color: #f4f7fa;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      line-height: 1.6;
      color: #333333;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    td, th {
      padding: 0;
    }

    /* Email Container */
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
    }

    /* Header Section */
    .header {
      background-color: #4CAF50; /* Approved default */
      color: #ffffff;
      padding: 30px 25px;
      text-align: center;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      position: relative;
    }

    .header.error-header {
      background-color: #f44336; /* Error/Declined */
    }

    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 1px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .header p {
      margin: 5px 0 0;
      font-size: 18px;
      font-weight: 400;
      opacity: 0.9;
    }

    .success-icon, .error-icon {
      font-size: 60px;
      margin-bottom: 15px;
      line-height: 1;
    }

    /* Content Area */
    .content {
      padding: 25px 30px;
      color: #333333;
      font-size: 15px;
    }

    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #222222;
    }

    .message {
      margin-bottom: 20px;
      line-height: 1.7;
    }

    .message strong {
      color: #000000;
      font-weight: 600;
    }

    /* Order Info */
    .order-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 25px 0;
      padding: 15px 20px;
      background-color: #f9f9f9;
      border: 1px solid #eeeeee;
      border-radius: 8px;
    }

    .order-number {
      font-size: 17px;
      font-weight: 700;
      color: #000000;
    }

    .status-badge {
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      color: #ffffff;
    }

    .status-approved {
      background-color: #28a745; /* Green */
    }

    .status-declined, .status-error {
      background-color: #dc3545; /* Red */
    }

    /* Product Section */
    .product-card {
      background-color: #fdfdfd;
      border: 1px solid #e9e9e9;
      border-radius: 10px;
      margin-bottom: 20px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .product-header {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .product-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #dddddd;
      flex-shrink: 0;
    }

    .product-details {
      flex-grow: 1;
    }

    .product-details h3 {
      margin: 0 0 5px;
      font-size: 16px;
      font-weight: 600;
      color: #222222;
    }

    .product-variant {
      font-size: 13px;
      color: #666666;
      background-color: #f0f0f0;
      padding: 4px 8px;
      border-radius: 5px;
      display: inline-block;
      margin-top: 5px;
    }

    .product-pricing {
      border-top: 1px dashed #e0e0e0;
      padding-top: 15px;
      margin-top: 5px;
    }

    .pricing-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #555555;
    }

    .pricing-row span:first-child {
      font-weight: 500;
    }

    .pricing-row span:last-child {
      font-weight: 600;
      color: #333333;
    }

    .pricing-row.total {
      margin-top: 15px; /* Add space above total */
      padding-top: 10px;
      border-top: 2px solid #e0e0e0; /* Stronger border for total */
      font-size: 18px;
      font-weight: 700;
      color: #000000;
    }

    /* Support Info */
    .support-info {
      background-color: #fff3cd; /* Light yellow for warnings/info */
      border: 1px solid #ffeeba;
      border-radius: 8px;
      padding: 20px;
      margin-top: 25px;
      text-align: center;
      color: #856404;
    }

    .support-info h4 {
      margin-top: 0;
      font-size: 18px;
      color: #664d03;
    }

    .support-link {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
    }

    .support-link:hover {
      text-decoration: underline;
    }

    /* Footer */
    .footer {
      background-color: #f0f2f5;
      padding: 25px 30px;
      text-align: center;
      font-size: 12px;
      color: #777777;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      border-top: 1px solid #e0e0e0;
    }

    .footer-links {
      margin-bottom: 15px;
    }

    .footer-links a {
      color: #007bff;
      text-decoration: none;
      margin: 0 10px;
      font-weight: 500;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    /* Responsive adjustments */
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
        box-shadow: none;
      }

      .header, .content, .footer {
        padding: 20px;
      }

      .header h1 {
        font-size: 28px;
      }

      .header p {
        font-size: 16px;
      }

      .success-icon, .error-icon {
        font-size: 50px;
      }

      .order-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 15px;
      }

      .product-card {
        padding: 15px;
      }

      .product-header {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }

      .product-image {
        width: 60px;
        height: 60px;
      }

      .product-details h3 {
        font-size: 15px;
      }

      .product-variant {
        font-size: 12px;
      }

      .pricing-row {
        font-size: 13px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${content}
    <div class="footer">
      <div class="footer-links">
        <a href="#">Track Your Order</a>
        <a href="#">Customer Support</a>
        <a href="#">Return Policy</a>
      </div>
      <p>&copy; 2024 eShop. All rights reserved.</p>
      <p>This email was sent regarding your order. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({
    email,
    name,
    order_number,
    total_price, // This is now the grand total
    tax_amount, // New parameter
    shipping_cost, // New parameter
    status,
    products
}: MailOptions) => {
    let subject = '';
    let content = '';

    // Calculate subtotal from products for display in email
    const subtotal_products = products.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Helper function to format currency
    const formatCurrency = (amount: number) => `₹${Number(amount).toFixed(2)}`;

    const productSection = products
        .map(
            (product) => `
      <div class="product-card">
        <div class="product-header">
          ${product.image
                    ? `<img src="${product.image}" alt="${product.title}" class="product-image" width="80" height="80"/>`
                    : `<img src="https://placehold.co/80x80/cccccc/333333?text=No+Image" alt="No Image" class="product-image" width="80" height="80"/>`
                }
          <div class="product-details">
            <h3>${product.title}</h3>
            ${product.variant
                    ? `<div class="product-variant">${product.variant}</div>`
                    : ''
                }
          </div>
        </div>
        
        <div class="product-pricing">
          <div class="pricing-row">
            <span>Price per item:</span>
            <span>${formatCurrency(product.price)}</span>
          </div>
          <div class="pricing-row">
            <span>Quantity:</span>
            <span>${product.quantity}</span>
          </div>
          <div class="pricing-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(product.price * product.quantity)}</span>
          </div>
        </div>
      </div>
    `
        )
        .join('');

    // Common price breakdown section for all statuses
    const priceBreakdownSection = `
        <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #eeeeee;">
            <div class="pricing-row">
                <span>Items Subtotal:</span>
                <span>${formatCurrency(subtotal_products)}</span>
            </div>
            <div class="pricing-row">
                <span>Tax:</span>
                <span>${formatCurrency(tax_amount)}</span>
            </div>
            <div class="pricing-row">
                <span>Shipping:</span>
                <span>${formatCurrency(shipping_cost)}</span>
            </div>
            <div class="pricing-row total">
                <span>Grand Total:</span>
                <span>${formatCurrency(total_price)}</span>
            </div>
        </div>
    `;

    if (status === 'approved') {
        subject = 'Your Order Has Been Confirmed!';
        content = `
    <div class="header">
      <div class="success-icon">🎉</div>
      <h1>eShop</h1>
      <p>Order Confirmation</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${name}!</div>
      
      <div class="message">
        Thank you for your purchase! We're excited to let you know that your order has been successfully confirmed and is now being processed.
      </div>
      
      <div class="order-info">
        <div class="order-number">Order #${order_number}</div>
        <div class="status-badge status-approved">Confirmed</div>
      </div>
      
      ${productSection}

      ${priceBreakdownSection}
      
      <div class="message">
        <strong>What's next?</strong><br/>
        We're preparing your order for shipment. You'll receive another email with tracking information once your order is on its way.
      </div>
      
      <div class="message">
        Thank you for choosing eShop! If you have any questions, don't hesitate to reach out to our support team.
      </div>
    </div>
  `;
    } else if (status === 'declined') {
        subject = 'Your Order Could Not Be Processed';
        content = `
    <div class="header error-header">
      <div class="error-icon">❌</div>
      <h1>eShop</h1>
      <p>Order Processing Issue</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      
      <div class="message">
        We encountered an issue while processing your recent order. Unfortunately, your payment could not be processed and we were unable to complete your purchase.
      </div>
      
      <div class="order-info">
        <div class="order-number">Order #${order_number}</div>
        <div class="status-badge status-${status}">Declined</div>
      </div>
      
      ${productSection}

      ${priceBreakdownSection}
      
      <div class="support-info">
        <h4>Need Help?</h4>
        <p>Please check your payment details and try placing your order again, or contact our support team for assistance:</p>
        <p><a href="mailto:support@eshop.com" class="support-link">support@eshop.com</a></p>
      </div>
      
      <div class="message">
        We apologize for any inconvenience and appreciate your understanding.
      </div>
    </div>
  `;
    } else if (status === 'error') {
        subject = 'Payment Gateway Error - Order Processing Failed';
        content = `
    <div class="header error-header">
      <div class="error-icon">⚠️</div>
      <h1>eShop</h1>
      <p>Gateway Failure</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      
      <div class="message">
        We experienced a technical issue with our payment gateway while processing your recent order. Due to this gateway failure, we were unable to complete your purchase at this time.
      </div>
      
      <div class="order-info">
        <div class="order-number">Order #${order_number}</div>
        <div class="status-badge status-${status}">Gateway Failure</div>
      </div>
      
      ${productSection}

      ${priceBreakdownSection}
      
      <div class="support-info">
        <h4>Technical Issue Resolved</h4>
        <p>Our technical team has been notified about this gateway failure. The issue should be resolved shortly. Please try placing your order again in a few minutes, or contact our support team if the problem persists:</p>
        <p><a href="mailto:support@eshop.com" class="support-link">support@eshop.com</a></p>
      </div>
      
      <div class="message">
        We sincerely apologize for this technical inconvenience and appreciate your patience while we resolve the gateway issue.
      </div>
    </div>
  `;
    }

    await transporter.sendMail({
        from: '"eShop" <noreply@eshop.com>',
        to: email,
        subject,
        html: getEmailTemplate(content)
    });
};

export default sendEmail;
