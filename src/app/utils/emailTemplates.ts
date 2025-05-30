export const getEmailTemplate = (
  name: string,
  orderNumber: string,
  total: number,
  status: string
): { subject: string; html: string } => {
  if (status === 'approved') {
    return {
      subject: `✅ Order Confirmation - ${orderNumber}`,
      html: `
        <h2>Hi ${name},</h2>
        <p>Your order <strong>${orderNumber}</strong> has been <strong>approved</strong>.</p>
        <p>Total: <strong>$${total.toFixed(2)}</strong></p>
        <p>Thank you for shopping with us!</p>
      `
    };
  }

  return {
    subject: `❌ Order Failed - ${orderNumber}`,
    html: `
      <h2>Hi ${name},</h2>
      <p>Your order <strong>${orderNumber}</strong> could not be processed.</p>
      <p>Status: ${status.toUpperCase()}</p>
      <p>Please <a href="mailto:support@example.com">contact support</a> or <a href="#">retry your order</a>.</p>
    `
  };
};
