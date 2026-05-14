import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import OpLogo from './OpLogo.jsx';

// Smooth-scrolls to a section by id; if we're not on the home page, route
// home first and scroll once it's mounted.
function useGoToSection() {
  const navigate = useNavigate();
  const location = useLocation();
  return (id) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { totalQty, setOpen } = useCart();
  const { user, signOut } = useAuth();
  const goToSection = useGoToSection();

  const closeDrawer = () => setDrawerOpen(false);

  const onSection = (id) => (e) => {
    e.preventDefault();
    goToSection(id);
  };

  const onSectionMobile = (id) => (e) => {
    e.preventDefault();
    closeDrawer();
    goToSection(id);
  };

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

  const location = useLocation();
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

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
          <Link to="/" className="logo">
            <OpLogo size={42} className="logo-svg" />
            <span className="logo-text">OP Flex</span>
          </Link>
          <nav className="nav-menu">
            <ul>
              <li><a href="#categories" onClick={onSection('categories')}>Shop All</a></li>
              <li><a href="#new" onClick={onSection('new')}>New Releases</a></li>
              <li className="has-drop">
                <a href="#categories" onClick={onSection('categories')}>Topwear ▾</a>
                <ul className="drop">
                  <li><Link to="/collections/tshirts">T-Shirts</Link></li>
                  <li><Link to="/collections/shirts">Shirts</Link></li>
                  <li><Link to="/collections/hoodies">Hoodies</Link></li>
                  <li><Link to="/collections/oversized-hoodie">Oversized Hoodies</Link></li>
                </ul>
              </li>
              <li className="has-drop">
                <Link to="/collections/joggers-unisex">Bottoms ▾</Link>
                <ul className="drop">
                  <li><Link to="/collections/joggers-unisex">Joggers</Link></li>
                  <li><Link to="/collections/denim-jeans">Jeans</Link></li>
                  <li><Link to="/collections/baggy-oversized-denim-jeans">Baggy Jeans</Link></li>
                </ul>
              </li>
              <li><Link to="/collections/caps">Just Caps</Link></li>
              <li><a href="#look" onClick={onSection('look')}>Shop The Look</a></li>
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
          <li><a href="#categories" onClick={onSectionMobile('categories')}>Shop All</a></li>
          <li><a href="#new" onClick={onSectionMobile('new')}>New Releases</a></li>
          <li><Link to="/collections/tshirts" onClick={closeDrawer}>T-Shirts</Link></li>
          <li><Link to="/collections/shirts" onClick={closeDrawer}>Shirts</Link></li>
          <li><Link to="/collections/hoodies" onClick={closeDrawer}>Hoodies</Link></li>
          <li><Link to="/collections/joggers-unisex" onClick={closeDrawer}>Joggers</Link></li>
          <li><Link to="/collections/denim-jeans" onClick={closeDrawer}>Jeans</Link></li>
          <li><Link to="/collections/caps" onClick={closeDrawer}>Just Caps</Link></li>
          <li><a href="#look" onClick={onSectionMobile('look')}>Shop The Look</a></li>
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
