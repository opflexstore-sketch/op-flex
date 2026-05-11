// Inline SVG of the OP brand mark — same artwork as /public/op-logo.svg
// but rendered straight into the DOM so the browser uses the already-loaded
// Anton webfont (no flash of fallback Impact, no extra network request).

export default function OpLogo({ size = 40, className = '', title = 'OP Flex' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 240 240"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect width="240" height="240" rx="40" fill="#0a0a0a" />
      <rect
        x="8" y="8" width="224" height="224" rx="32"
        fill="none" stroke="#ffd60a" strokeWidth="2" strokeOpacity="0.35"
      />
      <text
        x="120" y="170"
        fontFamily="'Anton', 'Impact', 'Arial Black', 'Helvetica Neue Condensed', sans-serif"
        fontWeight="900"
        fontSize="160"
        letterSpacing="-4"
        fill="#ffd60a"
        textAnchor="middle"
      >OP</text>
      <text
        x="120" y="208"
        fontFamily="'Anton', 'Impact', 'Arial Black', 'Helvetica Neue Condensed', sans-serif"
        fontWeight="900"
        fontSize="22"
        letterSpacing="6"
        fill="#ffd60a"
        textAnchor="middle"
      >★ FLEX ★</text>
    </svg>
  );
}
