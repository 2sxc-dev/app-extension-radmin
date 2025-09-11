import { CommandNames } from "@2sic.com/2sxc-typings";
import type { RowComponent } from "tabulator-tables";
import { cleanupFloatingMenus } from "../utils/floating-menu";
import { safeCmsRun } from "../utils/safe-cms-run";
import { getEntityIdentifiers } from "../utils/entity-identifiers";

/**
 * Open the delete dialog for a row and remove the row on success.
 * logger is optional and used for debug messages (signature: (...args)=>void).
 */
export function openDeleteRowDialog(
  e: Event,
  row: RowComponent,
  logger?: (...args: any[]) => void
) {
  e.preventDefault();
  logger?.("openDeleteRowDialog called", { row });
  cleanupFloatingMenus();

  const { ids, data } = getEntityIdentifiers(row);
  const { entityId, entityGuid } = ids;
  if (!entityId) {
    logger?.("No entityId found for delete", data);
    return;
  }

  logger?.("Opening delete dialog", { entityId, entityGuid });
  return safeCmsRun(row.getElement() as Element, "delete" as CommandNames, {
    entityId,
    entityGuid,
  }).then((res: any) => {
    logger?.("Delete result", res);
    try {
      if (res) row.delete();
    } catch (err) {
      logger?.("Error deleting row:", err);
    }
    return res;
  });
}
