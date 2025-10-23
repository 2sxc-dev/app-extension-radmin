import { CommandNames } from "@2sic.com/2sxc-typings";
import type { ColumnComponent } from "tabulator-tables";
import { safeCmsRun } from "../utils/safe-cms-run";
import { RadminTableConfig } from "../../../configs/radmin-table-config";
/**
 * Open the "new column config" dialog prefilled based on column definition.
 * logger is optional and used for debug messages (signature: (...args)=>void).
 */
export function openNewColumnDialog(
  e: Event,
  column: ColumnComponent,
  tableConfigData: RadminTableConfig,
  logger?: (...args: any[]) => void
) {
  e.preventDefault();
  logger?.("openNewColumnDialog called", { tableConfigData });

  const colDef = column.getDefinition() || {};
  const colTitle = colDef.title || "";
  
  const valueSelector = colTitle.replace(/\s+/g, '');

  const params = {
    contentType: "f58eaa8e-88c0-403a-a996-9afc01ec14be",
    prefill: {
      Title: colTitle,
      linkEnable: false,
      tooltipEnabled: false,
      ValueSelector: valueSelector, // Use the space-free version
    },
    fields: "ColumnConfigs",
    parent: tableConfigData.guid,
  };

  logger?.("Opening new column dialog", params);
  return safeCmsRun(
    column.getElement() as Element,
    "new" as CommandNames,
    params
  ).catch((err: string) => {
    logger?.("Error creating new column config:", err);
    throw err;
  });
}