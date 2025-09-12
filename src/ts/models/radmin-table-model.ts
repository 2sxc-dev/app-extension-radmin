import { RadminColumn } from "./radmin-column-model";

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
  searchEnabled?: boolean;
  sortOrderReverse?: boolean;
  columnSort?: string;
  columnConfigs: RadminColumn[];
  pagingMode?: string;
  pagingSize?: number;
  guid: string;
}
