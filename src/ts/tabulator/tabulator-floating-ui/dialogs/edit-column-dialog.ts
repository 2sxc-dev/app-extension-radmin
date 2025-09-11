import { CommandNames } from "@2sic.com/2sxc-typings";
import type { ColumnComponent } from "tabulator-tables";
import { cleanupFloatingMenus } from "../utils/floating-menu";
import { safeCmsRun } from "../utils/safe-cms-run";

/**
 * Open the edit dialog for a column config.
 * logger is optional and used for debug messages (signature: (...args)=>void).
 */
export function openEditColumnDialog(
  e: Event,
  column: ColumnComponent,
  entityId: number,
  logger?: (...args: any[]) => void
) {
  e.preventDefault();
  logger?.("openEditColumnDialog called", { entityId });
  cleanupFloatingMenus();
  logger?.("Opening edit column dialog", { entityId });
  return safeCmsRun(column.getElement() as Element, "edit" as CommandNames, {
    entityId,
  });
}
