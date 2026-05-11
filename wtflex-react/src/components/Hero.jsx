import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';

export default function Hero() {
  const [picks, setPicks] = useState([null, null, null]);

  useEffect(() => {
    let alive = true;
    fetchProducts({ limit: 8 })
      .then((products) => {
        if (!alive) return;
        const valid = products.filter((p) => p.featured && p.handle).slice(0, 3);
        if (valid.length) setPicks(valid);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-text">
          <p className="kicker">DROP 07 / SS26</p>
          <h1>
            FLEX <span className="outline">DIFFERENT</span><br />
            WEAR <span className="hl">BOLDER</span>
          </h1>
          <p className="lede">
            Premium Indian streetwear engineered for the rebels.
            Heavyweight cottons, oversized fits, killer prints — built to flex.
          </p>
          <div className="hero-cta">
            <a href="#new" className="btn btn-primary">SHOP THE DROP →</a>
            <a href="#categories" className="btn btn-ghost">CATEGORIES</a>
          </div>
          <div className="hero-meta">
            <div><b>150K+</b><span>FlexFam</span></div>
            <div><b>4.8★</b><span>Rated</span></div>
            <div><b>2-Day</b><span>Shipping</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <HeroCard className="hero-card-1" product={picks[0]} fallback="linear-gradient(135deg,#ff6b35,#f7931e)" tag="NEW" />
          <HeroCard className="hero-card-2" product={picks[1]} fallback="linear-gradient(135deg,#1a1a1a,#444)"   tag="DROP" tagClass="tag-dark" />
          <HeroCard className="hero-card-3" product={picks[2]} fallback="linear-gradient(135deg,#3b82f6,#1e40af)" tag="HOT"  tagClass="tag-blue" />
          <div className="sticker">★ FLEX FAM ★</div>
        </div>
      </div>
    </section>
  );
}

function HeroCard({ className, product, fallback, tag, tagClass = '' }) {
  const img = product?.featured ? publicUrl(product.featured) : null;
  const style = img
    ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundImage: fallback };

  const inner = (
    <>
      <div className="hero-img" style={style} />
      <span className={`tag ${tagClass}`}>{tag}</span>
    </>
  );

  if (product?.handle) {
    return (
      <Link
        to={`/products/${product.handle}`}
        className={`hero-card ${className}`}
        aria-label={product.title}
      >
        {inner}
      </Link>
    );
  }
  return <div className={`hero-card ${className}`}>{inner}</div>;
}
