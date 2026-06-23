/** Photonic artwork — native img for PNG/SVG alpha fidelity. */
export default function ForgeArtwork({
  src,
  className = "",
  width,
  height,
  priority = false,
}: {
  src: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={width}
      height={height}
      className={className}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
