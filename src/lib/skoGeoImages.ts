// Local geo hero images — always served from /public/geo/
import type { SkoGeo } from "@/types/sko";

export const SKO_GEO_IMAGES: Record<string, string> = {
  EMEA: "/geo/madrid.png",
  APAC: "/geo/singapore-marina-bay.png",
  Japan: "/geo/tokyo-tower-day.png",
  Americas: "/geo/americas-virtual.png",
};

export function resolveGeoImageUrl(geo: SkoGeo): string {
  if (geo.imageUrl?.startsWith("/geo/")) return geo.imageUrl;
  return SKO_GEO_IMAGES[String(geo.name)] ?? "/geo/americas-virtual.png";
}
