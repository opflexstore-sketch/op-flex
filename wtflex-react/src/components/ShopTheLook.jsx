import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollectionProducts, formatPrice } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';

// Each "look" is a real wtflex collection. Image + total price come from the live products.
const looks = [
  { name: 'OFF-DUTY ENERGY', desc: 'Boxy fit · Streetwear staples', handle: 'boxy-fit-tshirt-for-men-women', fallback: 'linear-gradient(135deg,#ea580c,#9a3412)' },
  { name: 'NIGHT RUNNER',    desc: 'Hoodies + heavyweight bottoms', handle: 'oversized-hoodie',             fallback: 'linear-gradient(135deg,#0c4a6e,#0f172a)' },
  { name: 'WEEKEND DRIP',    desc: 'Baggy denim · Effortless cool', handle: 'baggy-oversized-denim-jeans',  fallback: 'linear-gradient(135deg,#365314,#1a2e05)' },
];

export default function ShopTheLook() {
  const [looksData, setLooksData] = useState(
    looks.map((l) => ({ ...l, image: null, total: null }))
  );

  useEffect(() => {
    let alive = true;
    Promise.all(
      looks.map(async (l) => {
        try {
          const products = await fetchCollectionProducts(l.handle, { limit: 3 });
          const image = products.find((p) => p.featured)?.featured || null;
          const total = products
            .slice(0, 3)
            .reduce((sum, p) => sum + (p.price || 0), 0);
          return { ...l, image, total: total > 0 ? total : null };
        } catch {
          return { ...l, image: null, total: null };
        }
      })
    ).then((data) => alive && setLooksData(data));
    return () => { alive = false; };
  }, []);

  return (
    <section className="section" id="look">
      <div className="container">
        <div className="section-head">
          <h2>SHOP THE LOOK</h2>
          <p>Pre-styled. Ready to flex.</p>
        </div>
        <div className="look-grid">
          {looksData.map((l) => (
            <Link key={l.handle} className="look-card" to={`/collections/${l.handle}`}>
              <div
                className="look-img"
                style={
                  l.image
                    ? { backgroundImage: `url(${publicUrl(l.image)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: l.fallback }
                }
              />
              <div className="look-meta">
                <h4>{l.name}</h4>
                <p>{l.desc}</p>
                {l.total != null && <span className="look-price">{formatPrice(l.total)}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
