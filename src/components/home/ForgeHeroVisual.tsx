/** FORGE hero — transparent photonic crystal (native img preserves PNG alpha). */
export default function ForgeHeroVisual() {
  return (
    <div className="forge-hero-visual" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/forge/hero-crystal-beam.png"
        alt=""
        width={2720}
        height={2080}
        className="forge-hero-visual__art forge-hero-visual__art--beam"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
