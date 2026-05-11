// Decorative animated background. Sits behind all content (z-index 0); the
// dark / colored sections naturally cover it, so the effect only shows
// through the white / off-white sections.
export default function BackgroundEffects() {
  return (
    <div className="bg-effects" aria-hidden="true">
      <div className="bg-grid" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
    </div>
  );
}
