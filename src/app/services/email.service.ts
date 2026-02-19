import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

// ====== EmailJS Setup Instructions ======
// 1. Go to https://www.emailjs.com/ and sign up (free: 200 emails/month)
// 2. Add an Email Service (Gmail, Outlook, etc.) → copy SERVICE_ID
// 3. Create an Email Template with these variables:
//    - {{to_email}}       → recipient email
//    - {{to_name}}        → customer name
//    - {{order_id}}       → order ID
//    - {{order_items}}    → items list (HTML)
//    - {{subtotal}}       → subtotal amount
//    - {{discount}}       → discount amount
//    - {{shipping}}       → shipping cost
//    - {{tax}}            → tax amount
//    - {{total}}          → total amount
//    - {{payment_method}} → payment method
//    - {{shipping_address}} → full shipping address
//    - {{estimated_delivery}} → delivery date
//    - {{order_date}}     → order placed date
// 4. Copy TEMPLATE_ID
// 5. Go to Account → copy PUBLIC_KEY
// 6. Replace the values below

const EMAILJS_SERVICE_ID = 'service_qs31p2j';
const EMAILJS_TEMPLATE_ID = 'template_8gteqro';
const EMAILJS_PUBLIC_KEY = '9ETkkeAZgBeHyuL_d';

export interface OrderEmailData {
  toEmail: string;
  toName: string;
  orderId: string;
  items: { title: string; price: number; quantity: number }[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
  estimatedDelivery: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {

    const itemsHtml = data.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.title}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const orderItemsTable = `
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f0fdfa;">
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #0ea5e9;">Item</th>
            <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #0ea5e9;">Qty</th>
            <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #0ea5e9;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>`;

    const paymentLabel: Record<string, string> = {
      cod: '💵 Cash on Delivery',
      upi: '📱 UPI',
      card: '💳 Credit/Debit Card',
      netbanking: '🏦 Net Banking',
    };

    const templateParams = {
      to_email: data.toEmail,
      to_name: data.toName,
      from_name: 'My Cart Store',
      reply_to: 'noreply@mycart.com',
      order_id: data.orderId,
      order_items: orderItemsTable,
      subtotal: `$${data.subtotal.toFixed(2)}`,
      discount: data.discount > 0 ? `-$${data.discount.toFixed(2)}` : '$0.00',
      shipping: data.shippingCost > 0 ? `$${data.shippingCost.toFixed(2)}` : 'FREE',
      tax: `$${data.tax.toFixed(2)}`,
      total: `$${data.total.toFixed(2)}`,
      payment_method: paymentLabel[data.paymentMethod] || data.paymentMethod,
      shipping_address: data.shippingAddress,
      estimated_delivery: data.estimatedDelivery,
      order_date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    try {
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      console.log('Order confirmation email sent:', response.status);
      return true;
    } catch (error) {
      console.error('Failed to send order email:', error);
      return false;
    }
  }
}
