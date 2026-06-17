// Local geo hero images — always served from /public/geo/
import type { SkoGeo } from "@/types/sko";

export const SKO_GEO_IMAGES: Record<string, string> = {
  EMEA: "/geo/madrid.jpg",
  APAC: "/geo/singapore-marina-bay.jpg",
  Japan: "/geo/tokyo-tower-day.jpg",
  Americas: "/geo/americas-virtual.jpg",
};

export function resolveGeoImageUrl(geo: SkoGeo): string {
  if (geo.imageUrl?.startsWith("/geo/")) return geo.imageUrl;
  return SKO_GEO_IMAGES[String(geo.name)] ?? "/geo/americas-virtual.jpg";
}
