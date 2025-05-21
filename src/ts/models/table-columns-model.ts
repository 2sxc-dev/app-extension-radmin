/**
 * Table Columns Config
 * This is the format provided by the 2sxc backend.
 */
export interface DataViewColumnConfig {
  id: number;
  linkEnable: boolean;
  linkParameters: string
  linkViewId: string
  title: string;
  DataContentType: string;
  tooltipEnabled: boolean;
  guid: string;
  tooltipSelector: string;
  valueFormat: string;
  valueSelector: string;
}
