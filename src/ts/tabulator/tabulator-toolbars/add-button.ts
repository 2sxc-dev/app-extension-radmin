import type { Tabulator } from "tabulator-tables";
import { RadminTableConfig } from "../../configs/radmin-table-config";

declare const $2sxc: any;

/**
 * Show the floating Add button (extracted for readability)
 */
export function showAddButton(
  table: Tabulator,
  tableConfigData: RadminTableConfig,
  baseButtonSize: number,
  zIndex: number,
  log: (...args: any[]) => void
) {
  log("Adding add button to table");
  const tableElement = table.element as HTMLElement;

  tableElement.querySelectorAll(".table-add-button").forEach((n) => n.remove());

  const sxc = $2sxc(tableElement);
  if (!sxc.isEditMode()) {
    log("Not in edit mode, skipping add button");
    return;
  }

  const contentType = tableConfigData.dataContentType || "Default";
  const toolbarHtml = sxc.manage.getToolbar({
    contentType,
    action: "new",
    prefill: {},
  });

  const container = document.createElement("div");
  container.className = "table-add-button";
  Object.assign(container.style, {
    position: "absolute",
    top: "5px",
    right: "10px",
    zIndex: String(zIndex - 900),
    width: `${baseButtonSize}px`,
    height: `${baseButtonSize}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  container.innerHTML = toolbarHtml;
  tableElement.appendChild(container);
}
