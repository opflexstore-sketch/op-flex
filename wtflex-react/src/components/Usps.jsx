const usps = [
  { icon: '⚡', title: '2-DAY DELIVERY', desc: 'Lightning-fast shipping across India' },
  { icon: '🔄', title: 'EASY EXCHANGES', desc: '7-day no-questions-asked exchanges' },
  { icon: '🛡️', title: 'SECURE PAYMENTS', desc: 'UPI, Cards, Wallets — all safe' },
  { icon: '💎', title: 'PREMIUM QUALITY', desc: 'Heavyweight cottons, original prints' },
];

export default function Usps() {
  return (
    <section className="section">
      <div className="container">
        <div className="usp-grid">
          {usps.map((u) => (
            <div key={u.title} className="usp">
              <div className="usp-icon">{u.icon}</div>
              <h4>{u.title}</h4>
              <p>{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
