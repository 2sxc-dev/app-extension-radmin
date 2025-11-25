import { offset } from "@floating-ui/dom";

// Global type declarations
declare global {
  interface Window {
    FloatingUIDOM: any;
  }
}

/**
 * DOM helper utilities to manage floating menus tied to Tabulator rows/columns.
 */

export function cleanupFloatingMenus() {
  document.querySelectorAll(".floating-menu").forEach((el) => el.remove());
}

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
      };
    },
  };
}

/**
 * Compute position with Floating UI and apply to element.
 * middlewareOffsetFn returns a number offset value used by offset middleware.
 */
export function positionFloatingElement(
  virtualEl: any,
  floatingEl: HTMLElement,
  middlewareOffsetFn: () => number = () => 0,
  placement = "right"
): Promise<{ x: number; y: number }> {
  if (!window.FloatingUIDOM) {
    // If Floating UI isn't available just place the element at the virtualEl coords
    const rect = virtualEl.getBoundingClientRect();
    floatingEl.style.left = `${rect.left}px`;
    floatingEl.style.top = `${rect.top}px`;
    return Promise.resolve({ x: rect.left, y: rect.top });
  }

  return window.FloatingUIDOM.computePosition(virtualEl, floatingEl, {
    placement,
    middleware: [offset(middlewareOffsetFn)],
  }).then(({ x, y }: { x: number; y: number }) => {
    floatingEl.style.left = `${x}px`;
    floatingEl.style.top = `${y}px`;
    return { x, y };
  });
}
