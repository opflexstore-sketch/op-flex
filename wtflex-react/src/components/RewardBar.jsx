export default function RewardBar() {
  return (
    <section className="reward-bar">
      <div className="container">
        <div className="reward">
          <div className="reward-step done"><span>₹250</span><small>OFF</small></div>
          <div className="reward-line"><div className="fill" style={{ width: '65%' }} /></div>
          <div className="reward-step done"><span>₹800</span><small>OFF</small></div>
          <div className="reward-line"><div className="fill" style={{ width: '30%' }} /></div>
          <div className="reward-step"><span>₹1200</span><small>OFF</small></div>
        </div>
        <p className="reward-text">Spend more, save more — unlock exclusive rewards on every order ⚡</p>
      </div>
    </section>
  );
}
