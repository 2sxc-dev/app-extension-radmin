import { SxcCockpitColumnConfig } from "./column-config";

/** Table Config
 * This is the format provided by the 2sxc backend.
 */
export interface SxcCockpitTableConfig {
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
  columnConfigs: SxcCockpitColumnConfig[];
  pagingMode?: string;
  pagingSize?: number;
  guid: string;
}
