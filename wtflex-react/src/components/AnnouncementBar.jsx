export default function AnnouncementBar() {
  const messages = [
    <>USE CODE: <b>NEW10</b> TO GET 10% OFF ON YOUR FIRST PREPAID ORDER</>,
    '★',
    'FREE SHIPPING ON ORDERS ABOVE ₹999',
    '★',
    'OUR FLEXFAM IS NOW 150K STRONG',
    '★',
  ];
  return (
    <div className="announcement-bar">
      <div className="marquee">
        <div className="marquee-track">
          {[...messages, ...messages].map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
