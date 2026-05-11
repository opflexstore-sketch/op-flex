import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import { formatPrice } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';

export default function CartDrawer() {
  const { items, totalPrice, open, setOpen, remove, updateQty } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToCheckout = () => {
    setOpen(false);
    if (user) navigate('/checkout');
    else navigate('/login', { state: { from: '/checkout' } });
  };

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [open]);

  return (
    <>
      <aside className={`cart-drawer ${open ? 'open' : ''}`}>
        <div className="cart-head">
          <h3>YOUR CART {items.length > 0 && `(${items.length})`}</h3>
          <button className="close-btn" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="cart-body">
          {items.length === 0 ? (
            <p className="empty-cart">Your cart is empty. Time to flex 🔥</p>
          ) : (
            items.map((x) => (
              <div key={x.id} className="cart-item">
                <div
                  className="cart-item-img"
                  style={{
                    backgroundImage: x.featured ? `url(${publicUrl(x.featured)})` : 'linear-gradient(135deg,#1a1a1a,#404040)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="cart-item-info">
                  <h5>{x.title}</h5>
                  <div className="price">{formatPrice(x.price * x.qty)}</div>
                  <div className="qty-row">
                    <button onClick={() => updateQty(x.id, x.qty - 1)} disabled={x.qty <= 1}>−</button>
                    <span>{x.qty}</span>
                    <button onClick={() => updateQty(x.id, x.qty + 1)}>+</button>
                  </div>
                  <button className="cart-item-remove" onClick={() => remove(x.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-foot">
          <div className="cart-total"><span>Total</span><span>{formatPrice(totalPrice)}</span></div>
          <button
            className="btn btn-primary btn-block"
            disabled={items.length === 0}
            onClick={goToCheckout}
          >
            {user ? 'CHECKOUT →' : 'SIGN IN TO CHECKOUT →'}
          </button>
        </div>
      </aside>
      {open && <div className="drawer-overlay open" onClick={() => setOpen(false)} />}
    </>
  );
}
