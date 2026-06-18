/** User-pinned resources for a certification journey (stored on participant doc). */
export interface CertificationStagePins {
  learn: string[];
  practice: string[];
  connect: string[];
  community: string[];
  links: CertificationCustomLink[];
}

export interface CertificationCustomLink {
  id: string;
  title: string;
  url: string;
}

export type CertificationResourcesMap = Record<string, CertificationStagePins>;

export const EMPTY_CERT_PINS: CertificationStagePins = {
  learn: [],
  practice: [],
  connect: [],
  community: [],
  links: [],
};

export function emptyCertPins(): CertificationStagePins {
  return { learn: [], practice: [], connect: [], community: [], links: [] };
}

export type CertificationStage = keyof Omit<CertificationStagePins, "links">;
