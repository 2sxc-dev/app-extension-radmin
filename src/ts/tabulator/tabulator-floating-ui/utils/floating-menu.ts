/**
 * Lightweight floating helpers.
 *
 * Positions the floating element centered vertically on the provided virtual
 * coordinate (so the toolbar appears in the middle of the row) and offset
 * horizontally using the middlewareOffsetFn (mirrors old behavior).
 *
 * This implementation always uses a simple, self-contained fallback so it
 * doesn't rely on external packages or a global FloatingUIDOM.
 */

declare global {
  interface Window {
    // intentionally left open for other code that might add this global, but we won't use it here
    FloatingUIDOM?: any;
  }
}

/**
 * Remove any existing floating menu elements.
 */
export function cleanupFloatingMenus() {
  document.querySelectorAll(".floating-menu").forEach((el) => el.remove());
}

/**
 * Create a "virtual" element from coordinates that exposes getBoundingClientRect().
 * Used as reference for positioning.
 */
export function createVirtualElFromRects(x: number, y: number) {
  return {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x,
        y,
        top: y,
        left: x,
        right: x,
        bottom: y,
      } as DOMRect;
    },
  };
}

/**
 * Compute position and apply to element.
 *
 * - middlewareOffsetFn returns a horizontal offset (pixels).
 * - placement is kept for API compatibility but ignored here (we always place to the right).
 *
 * The function sets the floating element to position: fixed and places it so it is
 * vertically centered on the virtual y coordinate, and horizontally positioned at
 * virtual x + middlewareOffsetFn().
 *
 * Returns a Promise resolving to the applied { x, y } coordinates.
 */
export function positionFloatingElement(
  virtualEl: { getBoundingClientRect: () => DOMRect },
  floatingEl: HTMLElement,
  middlewareOffsetFn: () => number = () => 0,
  placement: string = "right"
): Promise<{ x: number; y: number }> {
  // Get reference rect from the virtual element
  const rect = virtualEl.getBoundingClientRect();
  const offsetValue = middlewareOffsetFn();

  // Ensure floating element is positioned relative to viewport so coords align
  floatingEl.style.position = "fixed";

  // Compute left and vertically centered top
  // Use rect.left as the baseline (virtual x), add offsetValue (middleware)
  const left = rect.left + offsetValue;

  // Determine height of floating element (may be 0 until rendered; we try both)
  const floatingHeight =
    floatingEl.getBoundingClientRect().height || floatingEl.offsetHeight || 0;

  // Center vertically on the virtual point (rect.top is the virtual y)
  const top = rect.top - floatingHeight / 2;

  // Apply computed coords (rounded to avoid blurry sub-pixel positioning)
  const appliedLeft = Math.round(left);
  const appliedTop = Math.round(top);

  floatingEl.style.left = `${appliedLeft}px`;
  floatingEl.style.top = `${appliedTop}px`;

  return Promise.resolve({ x: appliedLeft, y: appliedTop });
}
