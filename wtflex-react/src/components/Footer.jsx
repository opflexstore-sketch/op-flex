import OpLogo from './OpLogo.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a href="#" className="logo logo-footer">
              <OpLogo size={44} className="logo-svg" />
              <span className="logo-text">OP Flex</span>
            </a>
            <p className="muted">Premium Indian streetwear, engineered for the bold.</p>
            <div className="socials">
              {['IG','YT','X','TT'].map((s) => (
                <a key={s} href="#" aria-label={s}>{s}</a>
              ))}
            </div>
          </div>
          <FooterCol title="SHOP" items={['New Releases','T-Shirts','Joggers','Caps','Shop The Look']} />
          <FooterCol title="SUPPORT" items={['Track Order','Exchanges','Size Guide','Contact Us','FAQ']} />
          <FooterCol title="COMPANY" items={['About','Privacy Policy','Terms of Service','Refund Policy','Careers']} />
        </div>
        <div className="footer-bottom">
          <p>© 2026 OP Flex. Built with React + Vite.</p>
          <div className="payments">
            {['VISA','MC','UPI','RPAY'].map((p) => <span key={p}>{p}</span>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <h5>{title}</h5>
      <ul>{items.map((i) => <li key={i}><a href="#">{i}</a></li>)}</ul>
    </div>
  );
}
