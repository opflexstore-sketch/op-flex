import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollectionProducts, formatPrice } from '../api.js';
import { publicUrl } from '../lib/publicUrl.js';

export default function FeaturedCaps() {
  const [cap, setCap] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchCollectionProducts('caps', { limit: 4 })
      .then((products) => {
        if (!alive) return;
        const featured = products.find((p) => p.featured) || products[0];
        if (featured) setCap(featured);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <section className="section section-dark" id="caps">
      <div className="container">
        <div className="feature-strip">
          <div className="feature-content">
            <p className="kicker yellow">JUST DROPPED</p>
            <h2>
              {cap ? cap.title.toUpperCase() : <>COTTON CAPS<br /><span className="outline-light">COLLECTION</span></>}
            </h2>
            <p className="muted">
              {cap?.description?.slice(0, 160) ||
                'Heavyweight cotton, structured panels, embroidered logos. The cap that finishes every fit.'}
              {cap?.description?.length > 160 ? '…' : ''}
            </p>
            <div className="price-row">
              <span className="price">{formatPrice(cap?.price ?? 999)}</span>
              {cap?.compareAt > cap?.price && (
                <>
                  <span className="price-old">{formatPrice(cap.compareAt)}</span>
                  <span className="badge-save">SAVE {cap.save}%</span>
                </>
              )}
            </div>
            <Link to="/collections/caps" className="btn btn-yellow">SHOP CAPS →</Link>
          </div>
          <div className="feature-visual">
            <div
              className="big-cap"
              style={
                cap?.featured
                  ? {
                      backgroundImage: `url(${publicUrl(cap.featured)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
            >
              {!cap?.featured && <span className="big-cap-text">OP</span>}
            </div>
            <div className="orbit orbit-1" />
            <div className="orbit orbit-2" />
          </div>
        </div>
      </div>
    </section>
  );
}
