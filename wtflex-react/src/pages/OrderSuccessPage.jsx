import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';

const ORDERS_KEY = 'wtf_orders_v1';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    setOrder(all.find((o) => o.id === orderId) || null);
  }, [orderId]);

  if (!order) {
    return (
      <section className="section">
        <div className="container">
          <p className="centered muted">Order not found.</p>
          <p className="centered"><Link to="/" className="btn btn-ghost">← Back home</Link></p>
        </div>
      </section>
    );
  }

  const underReview = order.status === 'under_review';

  return (
    <section className="success-page">
      <div className="container">
        <div className="success-card">
          {underReview ? (
            <>
              <div className="success-check pending">⏳</div>
              <p className="kicker pending">UNDER REVIEW</p>
              <h1>Got your details 🔍</h1>
              <p className="muted">
                Thanks {order.customer.name.split(' ')[0]}! We're matching your UTR with our UPI inbox. Once your payment is verified your order will be confirmed and dispatched within 2-3 working days.
              </p>
            </>
          ) : (
            <>
              <div className="success-check">✓</div>
              <p className="kicker">ORDER RECEIVED</p>
              <h1>You're in 🔥</h1>
              <p className="muted">
                Thanks {order.customer.name.split(' ')[0]}! We'll verify your UPI payment and start packing — fits ship in 2-3 working days.
              </p>
            </>
          )}

          <div className="success-pills">
            <div>
              <small>ORDER ID</small>
              <b>{order.id}</b>
            </div>
            <div>
              <small>{underReview ? 'AMOUNT' : 'TOTAL PAID'}</small>
              <b>{formatPrice(order.total)}</b>
            </div>
            <div>
              <small>ESTIMATED DELIVERY</small>
              <b>{order.estimatedDelivery}</b>
            </div>
          </div>

          {order.verification && (
            <div className="success-section verification-block">
              <h3 className="form-section-h">Payment details submitted</h3>
              <div className="verification-rows">
                <div><small>UTR / TXN ID</small><b className="ref">{order.verification.utr}</b></div>
                <div><small>PHONE</small><b>****{order.verification.phoneLast4}</b></div>
                {order.paymentApp && <div><small>VIA</small><b>{order.paymentApp}</b></div>}
              </div>
              {order.verification.screenshot && (
                <div className="verification-screenshot">
                  <small>Screenshot attached</small>
                  <img src={order.verification.screenshot} alt="Payment screenshot" />
                </div>
              )}
            </div>
          )}

          {order.discount > 0 && (
            <p className="success-coupon">
              🎉 You saved <b>{formatPrice(order.discount)}</b> with code <b>{order.coupon?.code}</b>
            </p>
          )}

          <p className="success-mailer">
            📬 A confirmation email is on its way to <b>{order.customer.email}</b> with the full order details.
          </p>

          <div className="success-section">
            <h3 className="form-section-h">Items</h3>
            <ul className="summary-items">
              {order.items.map((it) => (
                <li key={it.id}>
                  <div
                    className="summary-img"
                    style={{
                      backgroundImage: it.image ? `url(${publicUrl(it.image)})` : 'linear-gradient(135deg,#1a1a1a,#404040)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="summary-meta">
                    <h5>{it.title}</h5>
                    <small>Qty {it.qty}</small>
                  </div>
                  <strong>{formatPrice(it.price * it.qty)}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="success-section">
            <h3 className="form-section-h">Shipping to</h3>
            <p className="success-addr">
              <b>{order.customer.name}</b><br />
              {order.customer.phone}<br />
              {order.customer.address1}{order.customer.address2 ? ', ' + order.customer.address2 : ''}<br />
              {order.customer.city}, {order.customer.state} {order.customer.pincode}<br />
              India
            </p>
          </div>

          <Link to="/" className="btn btn-primary btn-block">CONTINUE SHOPPING →</Link>
        </div>
      </div>
    </section>
  );
}
