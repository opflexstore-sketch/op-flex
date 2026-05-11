import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchCollectionProducts } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

// Pretty title for handles like "joggers-unisex" → "Joggers Unisex"
function prettyTitle(handle) {
  return handle
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CollectionPage() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    fetchCollectionProducts(handle, { limit: 50 })
      .then((p) => alive && setProducts(p))
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [handle]);

  const title = prettyTitle(handle);

  return (
    <section className="section collection-page">
      <div className="container">
        <nav className="breadcrumb">
          <button onClick={() => navigate(-1)}>← Back</button>
          <span>·</span>
          <Link to="/">Home</Link>
          <span>·</span>
          <span className="muted">Collection</span>
        </nav>

        <div className="collection-head">
          <h1>{title.toUpperCase()}</h1>
          {!loading && !err && (
            <p className="muted">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
          )}
        </div>

        {loading && <p className="centered muted">Loading collection…</p>}
        {err && <p className="centered muted">Couldn't load collection: {err}</p>}
        {!loading && !err && products.length === 0 && (
          <p className="centered muted">No products in this collection yet.</p>
        )}

        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
