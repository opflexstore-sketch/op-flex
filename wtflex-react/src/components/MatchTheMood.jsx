import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollectionPreviews } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';

// Real wtflex "[FRONTEND]" mood collections
const moods = [
  { title: 'FORMAL FITS',    sub: 'Sharp. Crisp. Refined.',     handle: 'formal-mood',  fallback: 'linear-gradient(135deg,#1e293b,#0f172a)' },
  { title: 'LUXURY REFINED', sub: 'Premium textures only.',     handle: 'luxury-mood',  fallback: 'linear-gradient(135deg,#7c2d12,#451a03)' },
  { title: 'ATHLEISURE',     sub: 'Move. Sweat. Flex.',         handle: 'gym-mood',     fallback: 'linear-gradient(135deg,#16a34a,#14532d)' },
  { title: 'SUMMER ESCAPE',  sub: 'Lightweight. Breezy. Loud.', handle: 'summer-mood',  fallback: 'linear-gradient(135deg,#f59e0b,#b45309)' },
  { title: 'BASICS DAILY',   sub: 'Daily drivers, elevated.',   handle: 'basic-mood',   fallback: 'linear-gradient(135deg,#475569,#1e293b)' },
  { title: 'STREET HEAT',    sub: 'Made to turn heads.',        handle: 'baggy-oversized-denim-jeans', fallback: 'linear-gradient(135deg,#be123c,#881337)' },
];

export default function MatchTheMood() {
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let alive = true;
    fetchCollectionPreviews(moods.map((m) => m.handle))
      .then((map) => alive && setPreviews(map))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <section className="section section-mood">
      <div className="container">
        <div className="section-head">
          <h2>MATCH THE MOOD</h2>
          <p>Curated drops for every vibe</p>
        </div>
        <div className="mood-grid">
          {moods.map((m) => {
            const img = previews[m.handle]?.image;
            const style = img
              ? { backgroundImage: `url(${publicUrl(img)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: m.fallback };
            return (
              <Link key={m.handle} className="mood-card" to={`/collections/${m.handle}`}>
                <div className="mood-img" style={style} />
                <div className="mood-overlay">
                  <h3>{m.title}</h3>
                  <p>{m.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
