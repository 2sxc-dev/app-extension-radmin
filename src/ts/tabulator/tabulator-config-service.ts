import { DataViewTableConfig } from "../models/table-model";
import { TabulatorColumnAdapter } from "./tabulator-column-adapter";
import { TabulatorConfig } from "./tabulator-models";

/**
 * Service for creating a Tabulator configuration from DataViewTableConfig.
 * Is used to convert the configuration from 2sxc into a format that Tabulator can understand.
 */
export class TabulatorConfigService {
  createTabulatorConfig(
    data: DataViewTableConfig,
    entries: object[]
  ): TabulatorConfig {
    const columnAdapter = new TabulatorColumnAdapter();
    
    return {
      layout: "fitDataStretch",
      columns: columnAdapter.convert(data.dataViewColumnConfig, data.columnsAutoShowRemaining, entries),
      data: [], // Will be replaced later with real data
      title: data.title || "2sxc Table",
      dataContentType: "",
      dataQuery: "",
      viewId: data.viewId,
      dataViewColumnConfig: data.dataViewColumnConfig,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: ""
    } as TabulatorConfig;
  }
}