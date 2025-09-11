import { CommandNames } from "@2sic.com/2sxc-typings";
import type { RowComponent } from "tabulator-tables";
import { cleanupFloatingMenus } from "../utils/floating-menu";
import { safeCmsRun } from "../utils/safe-cms-run";
import { getEntityIdentifiers } from "../utils/entity-identifiers";

/**
 * Open the edit dialog for a row.
 * logger is optional and used for debug messages (signature: (...args)=>void).
 */
export function openEditRowDialog(
  e: Event,
  row: RowComponent,
  logger?: (...args: any[]) => void
) {
  e.preventDefault();
  logger?.("openEditRowDialog called", { row });
  cleanupFloatingMenus();

  const { ids, data } = getEntityIdentifiers(row);
  const { entityId } = ids;
  if (!entityId) {
    logger?.("No entityId found for edit", data);
    return;
  }

  logger?.("Opening edit dialog", entityId);
  return safeCmsRun(row.getElement() as Element, "edit" as CommandNames, {
    entityId,
  });
}
