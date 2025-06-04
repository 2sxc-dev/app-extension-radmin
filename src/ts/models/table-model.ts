import { DataViewColumnConfig } from "./table-columns-model";

/** Table Config
 * This is the format provided by the 2sxc backend.
 */
export interface DataViewTableConfig {
  title: string;
  viewId: number;
  id: number;
  dataContentType: string;
  columnsAutoShowRemaining: boolean;
  dataQuery: string;
  search?: boolean;
  dataViewColumnConfig: DataViewColumnConfig[];
  pagingMode?: string;
  pagingSize?: number;
  guid: string;
}
