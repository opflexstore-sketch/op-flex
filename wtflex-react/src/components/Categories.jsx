import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollectionPreviews } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';

// Mapped to real wtflex.in collection handles
const categories = [
  { name: 'T-SHIRTS', handle: 'tshirts',        fallback: 'linear-gradient(135deg,#ff6b35,#ff8e53)' },
  { name: 'JOGGERS',  handle: 'joggers-unisex', fallback: 'linear-gradient(135deg,#0f172a,#334155)' },
  { name: 'HOODIES',  handle: 'hoodies',        fallback: 'linear-gradient(135deg,#dc2626,#991b1b)' },
  { name: 'SHIRTS',   handle: 'shirts',         fallback: 'linear-gradient(135deg,#0891b2,#0e7490)' },
  { name: 'JEANS',    handle: 'denim-jeans',    fallback: 'linear-gradient(135deg,#16a34a,#15803d)' },
  { name: 'CAPS',     handle: 'caps',           fallback: 'linear-gradient(135deg,#7c3aed,#5b21b6)' },
];

export default function Categories() {
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let alive = true;
    fetchCollectionPreviews(categories.map((c) => c.handle))
      .then((map) => alive && setPreviews(map))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <section className="section" id="categories">
      <div className="container">
        <div className="section-head">
          <h2>SHOP BY CATEGORY</h2>
          <p>Pick your vibe</p>
        </div>
        <div className="cat-grid">
          {categories.map((c) => {
            const preview = previews[c.handle];
            const img = preview?.image;
            const style = img
              ? { backgroundImage: `url(${publicUrl(img)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: c.fallback };
            return (
              <Link key={c.handle} className="cat-card" to={`/collections/${c.handle}`}>
                <div className="cat-img" style={style} />
                <div className="cat-info">
                  <h3>{c.name}</h3>
                  <span>Shop now →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
