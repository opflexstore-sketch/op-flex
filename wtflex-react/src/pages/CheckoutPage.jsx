import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import { formatPrice } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';
import { sendOrderEmail, estimateDeliveryRange } from '../lib/orderEmail.js';
import {
  upiConfigured, upiId, payeeName, UPI_APPS,
  buildAppUpiLink, buildUpiQrUrl, isLikelyMobile,
} from '../lib/upi.js';

const ORDERS_KEY = 'wtf_orders_v1';
// Pending checkout (between "Continue to payment" and "I've paid") is parked
// here. Survives reloads — important on mobile where switching to a UPI app
// often kills the browser tab and the user comes back to a fresh load.
const PENDING_KEY = 'wtf_pending_checkout_v1';

// Active coupon codes — keyed by code (upper-case match). Add/remove freely.
const COUPONS = {
  SUMMER35: { percent: 35, label: 'SUMMER SALE — 35% OFF' },
};
// Pre-fill the coupon input with this code so the user just has to hit Apply.
const SUGGESTED_COUPON = 'SUMMER35';

function resolveCoupon(rawCode) {
  if (!rawCode) return null;
  const code = rawCode.trim().toUpperCase();
  const def = COUPONS[code];
  return def ? { code, ...def } : null;
}

function newOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OP-${ts}-${rnd}`;
}

function saveOrder(order) {
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  all.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
}

function loadPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); }
  catch { return null; }
}
function savePending(p) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(p));
}
function clearPending() {
  localStorage.removeItem(PENDING_KEY);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clear } = useCart();
  const { user } = useAuth();

  // Lazy-init from any pending checkout in localStorage. This is what makes
  // the back-from-UPI-app flow resume mid-payment instead of bouncing home.
  const pending = loadPending();

  const [form, setForm] = useState(() => pending?.form || {
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [err, setErr] = useState('');
  const [stage, setStage] = useState(() => pending?.stage || 'form');
  const [orderId, setOrderId] = useState(() => pending?.orderId || null);
  const [submitting, setSubmitting] = useState(false);

  // Which UPI app the user picked (drives the deep-link button + QR label).
  // Hydrated from pending so it survives reloads from a killed tab.
  const [selectedApp, setSelectedApp] = useState(() => {
    const k = pending?.upiApp;
    return k ? UPI_APPS.find((a) => a.key === k) || null : null;
  });

  // True while the user is in their UPI app. Coming back from the app
  // (via visibility transition) flips us into the verify form below.
  const [waitingForReturn, setWaitingForReturn] = useState(() => !!pending?.awaitingReturn);
  // Same intent — "first mount with awaitingReturn already set" means the
  // OS killed the tab while user was in UPI app. We jump straight to verify.
  const initiallyAwaitingRef = useRef(!!pending?.awaitingReturn);

  // After the user returns from the UPI app, we show this form (UTR + phone
  // last 4 + optional screenshot). Submitting moves the order into 'under_review'.
  const [verifyOpen, setVerifyOpen] = useState(() => !!pending?.verifyOpen);
  const [verifyForm, setVerifyForm] = useState({
    utr: '',
    phoneLast4: '',
    screenshot: null,       // data URL or null
    screenshotName: '',
  });
  const [verifyErr, setVerifyErr] = useState('');

  // Coupon: only the code is persisted; the discount % is looked up live so
  // edits to the COUPONS table take effect immediately on the next render.
  const [couponInput, setCouponInput] = useState(pending?.coupon || SUGGESTED_COUPON);
  const [coupon, setCoupon] = useState(() => resolveCoupon(pending?.coupon));
  const [couponMsg, setCouponMsg] = useState('');

  const subtotal = totalPrice;
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const grandTotal = Math.max(0, subtotal - discount);

  const applyCoupon = (e) => {
    e?.preventDefault();
    setCouponMsg('');
    const c = resolveCoupon(couponInput);
    if (!c) { setCouponMsg('Invalid coupon code'); return; }
    setCoupon(c);
    setCouponMsg(`Yay — ${c.percent}% off applied!`);
  };
  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponMsg('');
  };

  useEffect(() => {
    if (!user) navigate('/login', { replace: true, state: { from: '/checkout' } });
  }, [user, navigate]);

  // Bounce home only when ON the form stage AND cart is empty. When we're
  // on the pay stage (returning from a UPI app), don't redirect — the user
  // is mid-payment.
  useEffect(() => {
    if (items.length === 0 && stage === 'form') navigate('/', { replace: true });
  }, [items.length, stage, navigate]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Valid email is required';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '')))
      return 'Enter a valid 10-digit Indian mobile number';
    if (!form.address1.trim()) return 'Address is required';
    if (!form.city.trim()) return 'City is required';
    if (!form.state.trim()) return 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) return 'Enter a valid 6-digit pincode';
    return null;
  };

  const proceedToPayment = (e) => {
    e.preventDefault();
    setErr('');
    if (!upiConfigured) {
      setErr('UPI not configured. Set VITE_UPI_ID in .env and restart.');
      return;
    }
    const v = validate();
    if (v) { setErr(v); return; }
    const id = newOrderId();
    setOrderId(id);
    setStage('pay');
    // Park the in-flight checkout so a reload (or returning from a UPI app
    // that killed the tab) lands back on the pay screen, not home.
    savePending({
      stage: 'pay',
      orderId: id,
      form,
      coupon: coupon?.code || '',
      upiApp: selectedApp?.key || '',
    });
  };

  // Re-persist whenever the user picks a different UPI app on the pay screen.
  const pickApp = (app) => {
    setSelectedApp(app);
    if (stage === 'pay' && orderId) {
      savePending({
        stage: 'pay',
        orderId,
        form,
        coupon: coupon?.code || '',
        upiApp: app?.key || '',
      });
    }
  };

  const backToForm = () => {
    setStage('form');
    clearPending();
  };

  // Records the order locally + fires the confirmation email, then routes
  // to the success page. If `verification` is provided (UTR etc.) the order
  // status is 'under_review'; otherwise it's a desktop manual-confirm fall-
  // through and we mark it 'awaiting_verification'.
  const placeOrder = (verification = null) => {
    setSubmitting(true);
    const order = {
      id: orderId,
      paymentMethod: 'UPI',
      paymentApp: selectedApp?.name || null,
      paymentReference: orderId,
      payeeUpiId: upiId,
      items: items.map((it) => ({
        id: it.id, handle: it.handle, title: it.title,
        price: it.price, qty: it.qty, image: it.featured,
      })),
      subtotal,
      discount,
      total: grandTotal,
      coupon: coupon ? { code: coupon.code, percent: coupon.percent, label: coupon.label } : null,
      customer: form,
      placedAt: Date.now(),
      estimatedDelivery: estimateDeliveryRange(),
      status: verification ? 'under_review' : 'awaiting_verification',
      verification: verification || null,
    };
    saveOrder(order);

    // Inject UTR + phone last 4 into the email's `payment_id` field so the
    // existing template renders the verification info without any change.
    const paymentRef = verification
      ? `UTR ${verification.utr} · phone ****${verification.phoneLast4}`
      : `UPI · ${orderId}`;

    sendOrderEmail({
      order, customer: form, items,
      subtotal, discount, total: grandTotal,
      coupon, paymentId: paymentRef,
    }).catch((e) => console.warn('Order email failed:', e.message));

    clearPending();
    clear();
    navigate(`/order-success/${order.id}`, { replace: true });
  };

  // Keep placeOrder fresh in a ref so the visibility handler below always
  // calls the latest version (with current items, totals, form, etc.).
  const placeOrderRef = useRef(placeOrder);
  placeOrderRef.current = placeOrder;

  // Tap handler for the OPEN [App] anchor. We always set the waiting state
  // and let the anchor's native href fire — on mobile the OS opens the UPI
  // app; on desktop the upi:// scheme typically does nothing, in which case
  // the user can fall back to the "Already paid → verify now" link below.
  const onOpenAppClick = () => {
    if (!selectedApp || submitting) return;
    setWaitingForReturn(true);
    savePending({
      stage: 'pay',
      orderId,
      form,
      coupon: coupon?.code || '',
      upiApp: selectedApp.key,
      awaitingReturn: true,
      awaitingReturnAt: Date.now(),
    });
  };

  // Manual skip — for desktop users who paid via QR scan from their phone,
  // or any user whose UPI app didn't fire from the deep link.
  const skipToVerify = () => {
    if (!selectedApp || submitting) return;
    setVerifyOpen(true);
    savePending({
      stage: 'pay',
      orderId,
      form,
      coupon: coupon?.code || '',
      upiApp: selectedApp.key,
      verifyOpen: true,
    });
  };

  // Returning from the UPI app moves us into the verify form (NOT directly
  // to the order — we ask for UTR / phone last 4 first).
  useEffect(() => {
    if (!waitingForReturn) return;

    const openVerify = () => {
      setWaitingForReturn(false);
      setVerifyOpen(true);
      savePending({
        stage: 'pay',
        orderId,
        form,
        coupon: coupon?.code || '',
        upiApp: selectedApp?.key || '',
        awaitingReturn: false,
        verifyOpen: true,
      });
    };

    // Killed-tab return: tab just mounted with awaitingReturn set + visible →
    // user is back from UPI app, jump straight to verify.
    if (initiallyAwaitingRef.current && document.visibilityState === 'visible') {
      initiallyAwaitingRef.current = false;
      openVerify();
      return;
    }
    initiallyAwaitingRef.current = false;

    const onReturn = () => {
      if (document.visibilityState === 'visible') openVerify();
    };
    document.addEventListener('visibilitychange', onReturn);
    // iOS fallback — visibilitychange occasionally misses on app→app return.
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [waitingForReturn]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelWaiting = () => {
    setWaitingForReturn(false);
    savePending({
      stage: 'pay',
      orderId,
      form,
      coupon: coupon?.code || '',
      upiApp: selectedApp?.key || '',
      awaitingReturn: false,
    });
  };

  const cancelVerify = () => {
    setVerifyOpen(false);
    setVerifyForm({ utr: '', phoneLast4: '', screenshot: null, screenshotName: '' });
    setVerifyErr('');
    savePending({
      stage: 'pay',
      orderId,
      form,
      coupon: coupon?.code || '',
      upiApp: selectedApp?.key || '',
      awaitingReturn: false,
      verifyOpen: false,
    });
  };

  const onScreenshotPick = async (e) => {
    setVerifyErr('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setVerifyErr('Please upload an image file.');
      e.target.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      setVerifyErr('Screenshot too large (max 1 MB).');
      e.target.value = '';
      return;
    }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      setVerifyForm((f) => ({ ...f, screenshot: dataUrl, screenshotName: file.name }));
    } catch {
      setVerifyErr('Could not read the screenshot — try a different file.');
    }
  };

  const submitVerification = (e) => {
    e.preventDefault();
    setVerifyErr('');
    const utr = verifyForm.utr.trim().toUpperCase();
    const phoneLast4 = verifyForm.phoneLast4.trim();
    // UTR is typically 12 digits but UPI apps emit alphanumeric refs of
    // 8–22 chars. Stay lenient: alphanumeric, 8–22 chars.
    if (!/^[A-Z0-9]{8,22}$/.test(utr)) {
      setVerifyErr('Enter a valid UTR / transaction ID (find it in your UPI app — usually 12 digits).');
      return;
    }
    if (!/^\d{4}$/.test(phoneLast4)) {
      setVerifyErr('Enter the last 4 digits of the mobile number you paid from.');
      return;
    }
    placeOrder({
      utr,
      phoneLast4,
      screenshot: verifyForm.screenshot,
      screenshotName: verifyForm.screenshotName,
      submittedAt: Date.now(),
    });
  };

  if (!user) return null;

  // ---- Payment stage (UPI) ----
  if (stage === 'pay') {
    const qrUrl = buildUpiQrUrl({ amount: grandTotal, orderId, size: 300 });

    // Verify state — user has returned from the UPI app. Collect proof.
    if (verifyOpen) {
      return (
        <section className="checkout-page">
          <div className="container">
            <nav className="breadcrumb">
              <button onClick={cancelVerify}>← I haven't paid yet</button>
            </nav>
            <div className="upi-stage">
              <div className="upi-card upi-verify-card">
                <p className="kicker">VERIFY PAYMENT</p>
                <h1>Just one more step</h1>
                <p className="muted">
                  Paste your <b>UTR</b> from {selectedApp?.name || 'your UPI app'}'s
                  transaction history so we can match the payment to your order.
                </p>

                <form onSubmit={submitVerification} className="verify-form">
                  <label>
                    <span>UTR / Transaction ID</span>
                    <input
                      type="text"
                      value={verifyForm.utr}
                      onChange={(e) => setVerifyForm((f) => ({
                        ...f,
                        utr: e.target.value.replace(/\s/g, '').toUpperCase().slice(0, 22),
                      }))}
                      placeholder="e.g. 412345678901"
                      autoFocus
                      required
                    />
                  </label>
                  <label>
                    <span>Last 4 digits of your phone</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={verifyForm.phoneLast4}
                      onChange={(e) => setVerifyForm((f) => ({
                        ...f,
                        phoneLast4: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))}
                      placeholder="••••"
                      required
                      maxLength={4}
                    />
                  </label>
                  <label className="file-label">
                    <span>Payment screenshot <em>(optional)</em></span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onScreenshotPick}
                    />
                    {verifyForm.screenshot && (
                      <div className="screenshot-preview">
                        <img src={verifyForm.screenshot} alt="Payment screenshot preview" />
                        <button
                          type="button"
                          onClick={() => setVerifyForm((f) => ({
                            ...f,
                            screenshot: null,
                            screenshotName: '',
                          }))}
                        >Remove</button>
                      </div>
                    )}
                  </label>

                  {verifyErr && <p className="auth-err">{verifyErr}</p>}

                  <button
                    type="submit"
                    className="btn btn-primary btn-block place-order-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : 'SUBMIT FOR REVIEW →'}
                  </button>

                  <p className="muted small">
                    Order: <b>{orderId}</b> · Amount: <b>{formatPrice(grandTotal)}</b>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      );
    }

    // Waiting state — user is in their UPI app. We hold the screen until
    // they come back; the visibility effect then places the order.
    if (waitingForReturn) {
      return (
        <section className="checkout-page">
          <div className="container">
            <div className="upi-stage">
              <div className="upi-card upi-waiting-card">
                <div className="spinner" />
                <p className="kicker">WAITING FOR PAYMENT</p>
                <h1>Complete payment in {selectedApp?.name || 'your UPI app'}</h1>
                <p className="muted">
                  We'll confirm your order the moment you switch back to this tab.
                </p>
                <div className="upi-waiting-meta">
                  <div><small>AMOUNT</small><b>{formatPrice(grandTotal)}</b></div>
                  <div><small>REFERENCE</small><b className="ref">{orderId}</b></div>
                </div>
                <button type="button" className="link-btn" onClick={cancelWaiting}>
                  ← App didn't open? Pick another
                </button>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="checkout-page">
        <div className="container">
          <nav className="breadcrumb">
            <button onClick={backToForm}>← Edit details</button>
          </nav>

          <div className="upi-stage">
            <div className="upi-card">
              <p className="kicker">PAY WITH UPI</p>
              <h1>Pay {formatPrice(grandTotal)}</h1>
              <p className="muted">
                {selectedApp
                  ? <>Open <b>{selectedApp.name}</b> below, or scan the QR with your phone.</>
                  : <>Pick the UPI app you want to use — money lands directly in <b>{payeeName}</b>'s account.</>}
              </p>

              {/* Step 1: app picker. Always visible; selected one stays highlighted. */}
              <div className="upi-app-grid" role="radiogroup" aria-label="Choose UPI app">
                {UPI_APPS.map((app) => {
                  const active = selectedApp?.key === app.key;
                  return (
                    <button
                      key={app.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`picker-tile ${active ? 'active' : ''}`}
                      onClick={() => pickApp(app)}
                    >
                      <span
                        className="picker-icon"
                        style={{ background: app.bg, color: app.fg }}
                      >{app.mono}</span>
                      <span className="picker-label">{app.short}</span>
                    </button>
                  );
                })}
              </div>

              {/* Step 2: only shows after picking. Primary action ABOVE the
                  QR so it's immediately visible without scrolling on phones. */}
              {selectedApp && (
                <>
                  <a
                    href={buildAppUpiLink(selectedApp.scheme, { amount: grandTotal, orderId })}
                    className={`btn btn-block upi-app-btn ${submitting ? 'is-disabled' : ''}`}
                    style={{ background: selectedApp.bg, color: selectedApp.fg }}
                    onClick={onOpenAppClick}
                    aria-disabled={submitting}
                  >
                    {submitting
                      ? 'PLACING ORDER…'
                      : <>OPEN {selectedApp.name.toUpperCase()} →</>}
                  </a>

                  <button
                    type="button"
                    className="upi-already-paid"
                    onClick={skipToVerify}
                    disabled={submitting}
                  >
                    Already paid? Verify now →
                  </button>

                  <p className="upi-or">— or scan with another phone —</p>

                  <div
                    className="upi-qr-wrap"
                    style={{ borderColor: selectedApp.bg }}
                  >
                    <img src={qrUrl} alt={`UPI QR for ${selectedApp.name}`} width={260} height={260} />
                    <div className="upi-meta">
                      <div className="upi-id-box">
                        <small>SCAN WITH</small>
                        <b>{selectedApp.name}</b>
                      </div>
                      <div className="upi-id-box">
                        <small>AMOUNT</small>
                        <b>{formatPrice(grandTotal)}</b>
                      </div>
                      <div className="upi-id-box">
                        <small>REFERENCE</small>
                        <b className="ref">{orderId}</b>
                      </div>
                    </div>
                  </div>

                  <ol className="upi-steps">
                    {isLikelyMobile() ? (
                      <>
                        <li>Tap <b>OPEN {selectedApp.name.toUpperCase()}</b> above — the app opens with the amount filled in.</li>
                        <li>Confirm <b>{formatPrice(grandTotal)}</b> and pay.</li>
                        <li>Come back to this tab to share your UTR for verification.</li>
                      </>
                    ) : (
                      <>
                        <li>Scan the QR with your phone — pay using any UPI app.</li>
                        <li>Once paid, tap <b>PLACE ORDER</b> above to confirm.</li>
                        <li>Done! We'll email confirmation and dispatch in 2-3 working days.</li>
                      </>
                    )}
                  </ol>

                  <p className="muted small">
                    Paying to <b>{upiId}</b> · reference <code>{orderId}</code>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---- Form stage ----
  if (items.length === 0) return null;

  return (
    <section className="checkout-page">
      <div className="container">
        <nav className="breadcrumb">
          <Link to="/">← Continue shopping</Link>
        </nav>
        <h1 className="checkout-title">CHECKOUT</h1>

        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={proceedToPayment}>
            <h3 className="form-section-h">Contact</h3>
            <div className="row-2">
              <label>
                <span>Full name</span>
                <input value={form.name} onChange={update('name')} required />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={update('email')} required />
              </label>
            </div>
            <label>
              <span>Mobile number</span>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={update('phone')}
                placeholder="10-digit Indian mobile"
                required
              />
            </label>

            <h3 className="form-section-h">Shipping address</h3>
            <label>
              <span>Address</span>
              <input
                value={form.address1}
                onChange={update('address1')}
                placeholder="Flat / House no, building, street"
                required
              />
            </label>
            <label>
              <span>Address line 2 (optional)</span>
              <input
                value={form.address2}
                onChange={update('address2')}
                placeholder="Locality, landmark"
              />
            </label>
            <div className="row-3">
              <label>
                <span>City</span>
                <input value={form.city} onChange={update('city')} required />
              </label>
              <label>
                <span>State</span>
                <input value={form.state} onChange={update('state')} required />
              </label>
              <label>
                <span>Pincode</span>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))}
                  required
                />
              </label>
            </div>

            {err && <p className="auth-err">{err}</p>}

            <button type="submit" className="btn btn-primary btn-block place-order-btn">
              CONTINUE TO PAYMENT · {formatPrice(grandTotal)} →
            </button>
            <p className="muted small">Pay via UPI in the next step.</p>
          </form>

          <aside className="checkout-summary">
            <h3 className="form-section-h">Order summary</h3>
            <ul className="summary-items">
              {items.map((it) => (
                <li key={it.id}>
                  <div
                    className="summary-img"
                    style={{
                      backgroundImage: it.featured ? `url(${publicUrl(it.featured)})` : 'linear-gradient(135deg,#1a1a1a,#404040)',
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

            {/* Coupon */}
            {coupon ? (
              <div className="coupon-applied">
                <div>
                  <small>{coupon.label}</small>
                  <b>{coupon.code}</b>
                </div>
                <button type="button" onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <div className="coupon-row">
                <form className="coupon-form" onSubmit={applyCoupon}>
                  <input
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    maxLength={20}
                  />
                  <button type="submit">Apply</button>
                </form>
                {couponMsg && <p className="coupon-msg">{couponMsg}</p>}
                <p className="coupon-hint">Tap <b>Apply</b> for 35% off ☀️</p>
              </div>
            )}

            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {discount > 0 && (
              <div className="summary-row discount">
                <span>Discount ({coupon.code})</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="summary-row"><span>Shipping</span><span className="free">FREE</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
            <p className="summary-eta">
              ⚡ Estimated delivery: <b>{estimateDeliveryRange()}</b>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

