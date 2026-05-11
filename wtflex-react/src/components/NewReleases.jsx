import { useEffect, useState } from 'react';
import { fetchProducts } from '../api.js';
import ProductCard from './ProductCard.jsx';

export default function NewReleases() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchProducts({ limit: 12 })
      .then((p) => alive && setProducts(p))
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <section className="section" id="new">
      <div className="container">
        <div className="section-head">
          <h2>NEW RELEASES</h2>
          <p>Hot off the rack — live from wtflex.in</p>
        </div>
        {loading && <p className="centered muted">Loading drops…</p>}
        {err && <p className="centered muted">Couldn't load products: {err}</p>}
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
