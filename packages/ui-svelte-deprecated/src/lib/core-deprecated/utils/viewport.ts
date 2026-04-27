export function getAdjustedDimensions(container: HTMLElement | undefined) {
  if (!container) return { width: 1, height: 1, dpr: 1 };

  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  return {
    width: rect.width,
    height: rect.height,
    // Dimensiones reales del canvas (píxeles físicos)
    physicalWidth: rect.width * dpr,
    physicalHeight: rect.height * dpr,
    dpr,
  };
}
