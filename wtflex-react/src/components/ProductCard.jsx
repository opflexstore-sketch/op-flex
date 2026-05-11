import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';
import { useCart } from '../CartContext.jsx';

export default function ProductCard({ product }) {
  const [hovering, setHovering] = useState(false);
  const [added, setAdded] = useState(false);
  const { add, setOpen } = useCart();

  const primaryPath = product.images[0] || product.featured;
  const secondaryPath = product.images[1] || primaryPath;
  const primary = publicUrl(primaryPath);
  const secondary = publicUrl(secondaryPath);
  const showImg = hovering ? secondary : primary;

  const tag =
    (product.tags || []).find((t) => /launch|new/i.test(t))
      ? 'NEW'
      : product.save >= 20
      ? 'HOT'
      : '';

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    add(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setOpen(true);
    }, 600);
  };

  return (
    <Link
      to={`/products/${product.handle}`}
      className="product-card"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="product-img">
        {tag && <span className="product-badge">{tag}</span>}
        <div
          className="product-img-inner"
          style={{
            backgroundImage: showImg
              ? `url(${showImg})`
              : 'linear-gradient(135deg,#1a1a1a,#404040)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>
      <div className="product-info">
        <h4>{product.title}</h4>
        <div className="product-prices">
          <span className="now">{formatPrice(product.price)}</span>
          {product.compareAt > product.price && (
            <>
              <span className="was">{formatPrice(product.compareAt)}</span>
              <span className="save">{product.save}% OFF</span>
            </>
          )}
        </div>
        <button
          className="add-cart-btn"
          onClick={handleAdd}
          style={added ? { background: '#16a34a' } : {}}
        >
          {added ? 'ADDED ✓' : 'ADD TO CART'}
        </button>
      </div>
    </Link>
  );
}
