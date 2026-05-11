import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductByHandle, formatPrice } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';
import { useCart } from '../CartContext.jsx';

export default function ProductPage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { add, setOpen } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [activeImg, setActiveImg] = useState(0);
  const [selected, setSelected] = useState({});
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    fetchProductByHandle(handle)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        // Default-pick the first available variant's options
        const firstAvailable = p.variants.find((v) => v.available) || p.variants[0];
        const initial = {};
        (p.options || []).forEach((opt, i) => {
          initial[opt.name] = firstAvailable?.[`option${i + 1}`] || opt.values?.[0];
        });
        setSelected(initial);
        setActiveImg(0);
      })
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [handle]);

  // Find variant matching the chosen options
  const matchedVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) =>
      product.options.every((opt, i) => v[`option${i + 1}`] === selected[opt.name])
    );
  }, [product, selected]);

  if (loading) {
    return (
      <section className="section pdp-loading">
        <div className="container"><p className="centered muted">Loading product…</p></div>
      </section>
    );
  }

  if (err || !product) {
    return (
      <section className="section">
        <div className="container">
          <p className="centered muted">Couldn't load product: {err || 'not found'}</p>
          <p className="centered"><Link to="/" className="btn btn-ghost">← Back home</Link></p>
        </div>
      </section>
    );
  }

  const price = matchedVariant?.price ?? product.price;
  const compareAt = matchedVariant?.compare_at_price ?? product.compareAt;
  const save = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const isSoldOut = matchedVariant ? !matchedVariant.available : !product.available;

  const handleAdd = () => {
    if (isSoldOut || !matchedVariant) return;
    add({
      ...product,
      id: matchedVariant.id,
      title: `${product.title} — ${matchedVariant.title}`,
      price,
      featured: product.images[activeImg] || product.featured,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setOpen(true);
    }, 600);
  };

  return (
    <section className="section pdp">
      <div className="container">
        <nav className="breadcrumb">
          <button onClick={() => navigate(-1)}>← Back</button>
          <span>·</span>
          <Link to="/">Home</Link>
          <span>·</span>
          <span className="muted">{product.type || 'Product'}</span>
        </nav>

        <div className="pdp-grid">
          {/* Gallery */}
          <div className="pdp-gallery">
            <div className="pdp-thumbs">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  className={`pdp-thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={publicUrl(src)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            <div className="pdp-main-img">
              {product.images[activeImg] && (
                <img src={publicUrl(product.images[activeImg])} alt={product.title} />
              )}
              {save > 0 && <span className="pdp-save-badge">SAVE {save}%</span>}
            </div>
          </div>

          {/* Info */}
          <div className="pdp-info">
            <p className="kicker">{product.type || product.tags[0] || 'NEW DROP'}</p>
            <h1 className="pdp-title">{product.title}</h1>

            <div className="pdp-prices">
              <span className="now">{formatPrice(price)}</span>
              {compareAt > price && (
                <>
                  <span className="was">{formatPrice(compareAt)}</span>
                  <span className="save">{save}% OFF</span>
                </>
              )}
            </div>
            <p className="pdp-tax">MRP inclusive of all taxes</p>

            {/* Option selectors */}
            {product.options.map((opt, i) => {
              const isColor = /color|colour/i.test(opt.name);
              return (
                <div key={opt.name} className="pdp-option">
                  <div className="pdp-option-head">
                    <strong>{opt.name}:</strong>
                    <span className="muted">{selected[opt.name]}</span>
                  </div>
                  <div className={`pdp-option-values ${isColor ? 'colors' : ''}`}>
                    {opt.values.map((value) => {
                      // Is the variant for this value available, considering the other selections?
                      const candidate = product.variants.find((v) => {
                        return product.options.every((o, j) => {
                          if (j === i) return v[`option${j + 1}`] === value;
                          return v[`option${j + 1}`] === selected[o.name];
                        });
                      });
                      const exists = !!candidate;
                      const sold = candidate && !candidate.available;
                      const active = selected[opt.name] === value;
                      return (
                        <button
                          key={value}
                          className={`pdp-swatch ${active ? 'active' : ''} ${sold ? 'sold' : ''} ${!exists ? 'missing' : ''}`}
                          onClick={() => setSelected((s) => ({ ...s, [opt.name]: value }))}
                          disabled={!exists}
                          title={sold ? 'Sold out' : value}
                          style={isColor ? { background: cssColor(value) } : undefined}
                        >
                          {isColor ? '' : value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button
              className={`btn btn-primary btn-block pdp-cta ${isSoldOut ? 'disabled' : ''}`}
              onClick={handleAdd}
              disabled={isSoldOut}
              style={added ? { background: '#16a34a' } : {}}
            >
              {isSoldOut ? 'SOLD OUT' : added ? 'ADDED ✓' : `ADD TO CART · ${formatPrice(price)}`}
            </button>

            <div className="pdp-perks">
              <span>⚡ 2-day delivery</span>
              <span>🔄 7-day exchange</span>
              <span>🛡️ Secure checkout</span>
            </div>

            {product.descriptionHtml && (
              <div className="pdp-desc">
                <h3>DESCRIPTION</h3>
                <div
                  className="pdp-desc-body"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </div>
            )}

            <div className="pdp-meta">
              <p><strong>SKU:</strong> {matchedVariant?.sku || '—'}</p>
              <p><strong>Vendor:</strong> {product.vendor || 'WTF'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Map common option text to a CSS color so swatches look right.
const COLOR_MAP = {
  black: '#0a0a0a', white: '#fafafa', red: '#dc2626', blue: '#2563eb',
  navy: '#1e3a8a', green: '#16a34a', yellow: '#fbbf24', orange: '#ea580c',
  brown: '#78350f', beige: '#d4b48a', cream: '#f5e7c1', grey: '#6b7280',
  gray: '#6b7280', pink: '#ec4899', purple: '#7c3aed', maroon: '#7f1d1d',
  olive: '#65a30d', mustard: '#d97706',
};
function cssColor(value) {
  if (!value) return '#999';
  const v = value.toLowerCase();
  for (const key of Object.keys(COLOR_MAP)) {
    if (v.includes(key)) return COLOR_MAP[key];
  }
  return '#999';
}
