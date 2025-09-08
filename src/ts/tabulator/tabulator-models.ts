import { CellComponent } from "tabulator-tables";
import { SxcCockpitTableConfig } from "../models/table-config";

/** Tabulator Config
 * This is the format expected by the Tabulator library.
 */
export interface TabulatorConfig extends SxcCockpitTableConfig {
  layout:
    | "fitDataStretch"
    | "fitData"
    | "fitColumns"
    | "fitDataFill"
    | "fitDataTable"
    | undefined;
  data: object[];
  columns: { title: string; field: string }[];
  pagination: boolean;
  paginationSize: number;
}

/** Tabulator Column Config
 * This is the format for the expected Tabulator Columns configuration options
 */
export interface TabulatorColumnConfig {
  title: string;
  field: string;
  tooltip?:
    | boolean
    | string
    | Node
    | ((e: Event, cell: CellComponent) => boolean | string | Node);
  headerHozAlign?: "right" | "left" | "center";
  hozAlign?: "right" | "left" | "center";
  width?: number | "automatic";
  formatter?: string | ((cell: CellComponent) => string);
  formatterParams?: object;
}
