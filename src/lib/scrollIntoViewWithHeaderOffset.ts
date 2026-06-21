const SITE_HEADER_SELECTOR = ".site-header";

export function scrollIntoViewWithHeaderOffset(
  element: HTMLElement | null | undefined,
  options?: { behavior?: ScrollBehavior; offset?: number },
): void {
  if (!element || typeof window === "undefined") return;

  const behavior = options?.behavior ?? "smooth";
  const extraOffset = options?.offset ?? 8;
  const headerEl = document.querySelector<HTMLElement>(SITE_HEADER_SELECTOR);
  const headerOffset = headerEl?.getBoundingClientRect().height ?? 56;

  const run = () => {
    const top =
      element.getBoundingClientRect().top +
      window.scrollY -
      headerOffset -
      extraOffset;
    window.scrollTo({ top: Math.max(0, top), behavior });
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}
