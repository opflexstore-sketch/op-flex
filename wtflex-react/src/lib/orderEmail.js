import emailjs from '@emailjs/browser';

// EmailJS keys — same service + public key as the OTP flow, but a separate
// template (so the body can be a full order summary instead of just an OTP).
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
console.log('ADMIN_EMAIL:', ADMIN_EMAIL);

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export function estimateDeliveryRange(from = new Date()) {
  const fmt = (d) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const start = new Date(from); start.setDate(start.getDate() + 2);
  const end   = new Date(from); end.setDate(end.getDate() + 3);
  return `${fmt(start)} – ${fmt(end)}`;
}

// Builds an HTML <table> for the items so the email can render a real order summary.
function renderItemsHtml(items, { subtotal, discount, couponCode } = {}) {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #eee; vertical-align:top;">
        <div style="font-weight:700; color:#0a0a0a; font-size:14px;">${escape(it.title)}</div>
        <div style="color:#888; font-size:12px;">Qty: ${it.qty}</div>
      </td>
      <td style="padding:12px 0; border-bottom:1px solid #eee; text-align:right; font-weight:700; color:#0a0a0a; font-size:14px; vertical-align:top;">
        ${inr(it.price * it.qty)}
      </td>
    </tr>
  `).join('');

  const subtotalRow = subtotal != null && discount > 0 ? `
    <tr>
      <td style="padding:14px 0 4px; font-size:13px; color:#666;">Subtotal</td>
      <td style="padding:14px 0 4px; font-size:13px; color:#666; text-align:right;">${inr(subtotal)}</td>
    </tr>
  ` : '';

  const discountRow = discount > 0 ? `
    <tr>
      <td style="padding:4px 0; font-size:13px; color:#15803d; font-weight:700;">
        Discount${couponCode ? ` (${escape(couponCode)})` : ''}
      </td>
      <td style="padding:4px 0; font-size:13px; color:#15803d; font-weight:700; text-align:right;">
        −${inr(discount)}
      </td>
    </tr>
  ` : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}${subtotalRow}${discountRow}</table>`;
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function sendOrderEmail({
  order, customer, items,
  subtotal, discount = 0, coupon = null,
  total, paymentId,
}) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error(
      'Order email not configured. Set VITE_EMAILJS_ORDER_TEMPLATE_ID in .env and restart.'
    );
  }
  const shared = {
    app_name: 'OP Flex',
    order_id: order.id,
    order_total: inr(total),
    payment_id: paymentId || '—',
    placed_at: new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: 'numeric',
    }),
    estimated_delivery: estimateDeliveryRange(),
    shipping_name: customer.name,
    shipping_phone: customer.phone,
    shipping_address: [
      customer.address1,
      customer.address2,
      `${customer.city}, ${customer.state} ${customer.pincode}`,
      'India',
    ].filter(Boolean).join(', '),
    order_items_html: renderItemsHtml(items, {
      subtotal, discount, couponCode: coupon?.code,
    }),
    item_count: items.reduce((s, it) => s + it.qty, 0),
  };

  // Primary send to the customer — failure surfaces to the caller.
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { ...shared, to_email: customer.email, to_name: customer.name },
    { publicKey: PUBLIC_KEY }
  );

  // Admin copy — separate send (not BCC). Best-effort so a failure here
  // doesn't block the order success page.
  if (ADMIN_EMAIL && ADMIN_EMAIL.toLowerCase() !== customer.email.toLowerCase()) {
    emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { ...shared, to_email: ADMIN_EMAIL, to_name: `Admin · Order from ${customer.name}` },
      { publicKey: PUBLIC_KEY }
    ).catch((e) => console.warn('Admin order copy failed:', e.message));
  }
}
