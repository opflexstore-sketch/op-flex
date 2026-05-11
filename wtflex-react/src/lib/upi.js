// Builds UPI deep links and a QR image URL.
//
// Reads two client env vars (safe to expose — UPI IDs are public anyway):
//   VITE_UPI_ID         e.g. aryansihag14@okicici
//   VITE_UPI_PAYEE_NAME e.g. OP Flex

const UPI_ID = import.meta.env.VITE_UPI_ID;
const PAYEE = import.meta.env.VITE_UPI_PAYEE_NAME || 'OP Flex';

export const upiConfigured = !!UPI_ID;
export const upiId = UPI_ID;
export const payeeName = PAYEE;

// Spaces become %20, not `+` — required by GPay and others which read the
// `pn` / `tn` fields literally.
const enc = (v) => encodeURIComponent(String(v));

// App-specific URL schemes. Tapping these on a phone where the matching app
// is installed bypasses the system default UPI handler completely — so a
// user with WhatsApp Pay as default still goes to GPay if they choose GPay.
//
// The path AFTER the scheme matters per app:
//   tez://upi/pay      (Google Pay legacy scheme, still active)
//   phonepe://pay
//   paytmmp://pay      (paytm's UPI deep-link host)
//   credpay://pay
//   bhim://pay
//   amazonpay://pay
//   upi://pay          (generic — OS shows the chooser)
//
// Brand colors are official-ish guidelines. The monogram is rendered as a
// big bold letter so we don't need any image assets.
export const UPI_APPS = [
  { key: 'gpay',     name: 'Google Pay', short: 'GPay',     mono: 'G',  bg: '#1A73E8', fg: '#fff',  scheme: 'tez://upi/pay' },
  { key: 'phonepe',  name: 'PhonePe',    short: 'PhonePe',  mono: 'P',  bg: '#5F259F', fg: '#fff',  scheme: 'phonepe://pay' },
  { key: 'paytm',    name: 'Paytm',      short: 'Paytm',    mono: 'P',  bg: '#00BAF2', fg: '#002970', scheme: 'paytmmp://pay' },
  { key: 'bhim',     name: 'BHIM',       short: 'BHIM',     mono: 'B',  bg: '#00A859', fg: '#fff',  scheme: 'bhim://pay' },
  { key: 'amazon',   name: 'Amazon Pay', short: 'Amazon',   mono: 'A',  bg: '#FF9900', fg: '#0F1111', scheme: 'amazonpay://pay' },
  { key: 'upi',      name: 'Any UPI app', short: 'Other',   mono: '★',  bg: '#0a0a0a', fg: '#ffd60a', scheme: 'upi://pay' },
];

// Builds the full deep link for one specific app, with order parameters.
export function buildAppUpiLink(scheme, { amount, orderId }) {
  if (!UPI_ID) throw new Error('VITE_UPI_ID not configured.');
  const qs = [
    `pa=${enc(UPI_ID)}`,
    `pn=${enc(PAYEE)}`,
    `am=${Number(amount).toFixed(2)}`,
    `cu=INR`,
    `tn=${enc(`Order ${orderId}`)}`,
  ].join('&');
  return `${scheme}?${qs}`;
}

// Generic upi:// link (legacy / QR).
export function buildUpiLink({ amount, orderId }) {
  return buildAppUpiLink('upi://pay', { amount, orderId });
}

// QR image of the generic upi:// link — works with any UPI app's scanner.
export function buildUpiQrUrl({ amount, orderId, size = 300 }) {
  const link = buildUpiLink({ amount, orderId });
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;
}

export function isLikelyMobile() {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
}
