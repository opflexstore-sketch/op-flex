import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setMsg("You're in. Check your inbox 🔥");
    setEmail('');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <section className="newsletter">
      <div className="container">
        <div className="news-wrap">
          <h2>JOIN THE <span className="outline-light">FLEXFAM</span></h2>
          <p>Get early access to drops, exclusive codes &amp; free streetwear gospel.</p>
          <form className="news-form" onSubmit={submit}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">SUBSCRIBE →</button>
          </form>
          <p className="news-msg">{msg}</p>
        </div>
      </div>
    </section>
  );
}
