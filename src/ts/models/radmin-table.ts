import { RadminColumn } from "./radmin-column";

/** Table Config
 * This is the format provided by the 2sxc backend.
 */
export interface RadminTable {
  title: string;
  viewId: number;
  id: number;
  dataContentType: string;
  columnsAutoShowRemaining: boolean;
  enableAdd: boolean;
  enableDelete: boolean;
  enableEdit: boolean;
  dataQuery: string;
  search?: boolean;
  columnConfigs: RadminColumn[];
  pagingMode?: string;
  pagingSize?: number;
  guid: string;
}
