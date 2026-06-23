import Image from "next/image";

/** FORGE hero — single transparent photonic crystal (PNG alpha). */
export default function ForgeHeroVisual() {
  return (
    <div className="forge-hero-visual" aria-hidden="true">
      <div className="forge-hero-visual__glow" />
      <Image
        src="/forge/hero-crystal-beam.png"
        alt=""
        width={820}
        height={980}
        className="forge-hero-visual__art forge-hero-visual__art--beam"
        priority
        unoptimized
      />
    </div>
  );
}
