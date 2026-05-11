export default function Strip() {
  const tokens = ['FLEX DIFFERENT','★','WEAR BOLDER','★','BUILT IN INDIA','★'];
  return (
    <section className="strip">
      <div className="marquee">
        <div className="marquee-track strip-track">
          {[...tokens, ...tokens, ...tokens].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
