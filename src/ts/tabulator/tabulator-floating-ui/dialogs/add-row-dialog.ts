import { CommandNames } from "@2sic.com/2sxc-typings";
import type { Tabulator } from "tabulator-tables";
import { RadminTable } from "../../../models/radmin-table-model";
import { cleanupFloatingMenus } from "../utils/floating-menu";
import { safeCmsRun } from "../utils/safe-cms-run";

/**
 * Open the "new" dialog to add a row, then refresh table data.
 * logger is optional and used for debug messages (signature: (...args)=>void).
 */
export function openAddRowDialog(
  e: Event,
  table: Tabulator,
  tableConfigData: RadminTable,
  logger?: (...args: any[]) => void
) {
  e.preventDefault();
  logger?.("openAddRowDialog called", { tableConfigData });
  cleanupFloatingMenus();

  const params = {
    contentType: tableConfigData.dataContentType,
    prefill: {},
  };

  logger?.("Opening add row dialog", params);
  return safeCmsRun(
    table.element as HTMLElement,
    "new" as CommandNames,
    params
  ).then((res: any) => {
    logger?.("Add row result", res);
    try {
      table.replaceData();
    } catch (err) {
      logger?.("Error replacing data after add:", err);
    }
    return res;
  });
}
