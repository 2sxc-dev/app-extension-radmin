export interface CreateButtonOptions {
  baseButtonSize?: number;
  zIndex?: number;
  fullSize?: boolean;
}

/**
 * Returns a style object compatible with Object.assign(target.style, styles)
 */
export function iconButtonStyle(
  baseButtonSize = 40,
  zIndex = 1000,
  fullSize = false
): Partial<CSSStyleDeclaration> {
  const sizeStyles: Partial<CSSStyleDeclaration> = fullSize
    ? { width: "100%", height: "100%" }
    : {
        width: `${baseButtonSize}px`,
        height: `${baseButtonSize}px`,
      };

  return {
    ...sizeStyles,
    borderRadius: "50%",
    background: "white",
    border: "1px solid #ccc",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    cursor: "pointer",
    zIndex: String(zIndex),
  };
}

/**
 * Create an HTML button element with consistent styling and safe click handling.
 */
export function createIconButton(
  icon: string,
  title: string,
  onClick: (ev: Event) => any,
  options: CreateButtonOptions = {}
): HTMLButtonElement {
  const { baseButtonSize = 40, zIndex = 1000, fullSize = false } = options;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = title;
  btn.innerHTML = icon;
  Object.assign(btn.style, iconButtonStyle(baseButtonSize, zIndex, fullSize));

  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    try {
      onClick(ev);
    } catch (err) {
      // Keep errors local to the handler
      // eslint-disable-next-line no-console
      console.error("Button click handler error:", err);
    }
  });

  return btn;
}
