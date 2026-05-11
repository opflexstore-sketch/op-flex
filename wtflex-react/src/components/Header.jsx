import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import OpLogo from './OpLogo.jsx';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { totalQty, setOpen } = useCart();
  const { user, signOut } = useAuth();

  // Click outside the user menu closes it.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
  }, [drawerOpen]);

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-wrap">
          <button
            className="hamburger"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <span /><span /><span />
          </button>
          <a href="#" className="logo">
            <OpLogo size={42} className="logo-svg" />
            <span className="logo-text">OP Flex</span>
          </a>
          <nav className="nav-menu">
            <ul>
              <li><a href="#shop">Shop All</a></li>
              <li><a href="#new">New Releases</a></li>
              <li className="has-drop">
                <a href="#categories">Topwear ▾</a>
                <ul className="drop">
                  <li><a href="#">T-Shirts</a></li>
                  <li><a href="#">Shirts</a></li>
                  <li><a href="#">Hoodies</a></li>
                  <li><a href="#">Polos</a></li>
                </ul>
              </li>
              <li className="has-drop">
                <a href="#categories">Bottoms ▾</a>
                <ul className="drop">
                  <li><a href="#">Joggers</a></li>
                  <li><a href="#">Jeans</a></li>
                  <li><a href="#">Cargos</a></li>
                  <li><a href="#">Parachute Pants</a></li>
                </ul>
              </li>
              <li><a href="#caps">Just Caps</a></li>
              <li><a href="#look">Shop The Look</a></li>
            </ul>
          </nav>
          <div className="nav-actions">
            <button className="icon-btn" aria-label="Search">
              <SearchIcon />
            </button>

            {user ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  className="icon-btn user-btn"
                  aria-label="Account menu"
                  onClick={() => setUserMenuOpen((o) => !o)}
                >
                  <span className="user-avatar">
                    {(user.name || user.email)[0].toUpperCase()}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-head">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="icon-btn" aria-label="Sign in">
                <UserIcon />
              </Link>
            )}

            <button
              className="icon-btn cart-btn"
              aria-label="Cart"
              onClick={() => setOpen(true)}
            >
              <CartIcon />
              {totalQty > 0 && <span className="cart-count">{totalQty}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-head">
          <OpLogo size={42} className="logo-svg" />
          <button className="close-btn" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <ul className="drawer-list">
          {['Shop All','New Releases','Topwear','Bottoms','Just Caps','Shop The Look'].map(label => (
            <li key={label}><a href="#" onClick={() => setDrawerOpen(false)}>{label}</a></li>
          ))}
        </ul>
      </div>
      {drawerOpen && (
        <div className="drawer-overlay open" onClick={() => setDrawerOpen(false)} />
      )}
    </>
  );
}

const iconProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
const SearchIcon = () => (
  <svg {...iconProps}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
const UserIcon = () => (
  <svg {...iconProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const CartIcon = () => (
  <svg {...iconProps}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
);
