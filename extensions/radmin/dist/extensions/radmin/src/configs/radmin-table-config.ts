import { RadminColumnConfig } from "./radmin-column-config";

/** Table Config
 * This is the format provided by the 2sxc backend.
 */
export interface RadminTableConfig {
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
  columnConfigs: RadminColumnConfig[];
  pagingMode?: string;
  pagingSize?: number;
  guid: string;
}
