import { DataViewTableConfig } from "../models/data-view-table-config";
import { JsonSchema } from "../models/json-schema";
import { TabulatorColumnAdapter } from "./tabulator-column-adapter";
import { TabulatorConfig } from "./tabulator-models";

/**
 * Service for creating a Tabulator configuration from DataViewTableConfig.
 * Is used to convert the configuration from 2sxc into a format that Tabulator can understand.
 */
export class TabulatorConfigService {
  createTabulatorConfig(
    data: DataViewTableConfig,
    schema: JsonSchema
  ): TabulatorConfig {
    const columnAdapter = new TabulatorColumnAdapter();

    return {
      layout: "fitDataFill",
      columns: columnAdapter.convert(
        data.dataViewColumnConfig,
        data.columnsAutoShowRemaining,
        schema
      ),
      title: data.title || "2sxc Table",
      dataContentType: "",
      dataQuery: "",
      viewId: data.viewId,
      id: data.id,
      dataViewColumnConfig: data.dataViewColumnConfig,
      search: data.search,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: "",
    } as TabulatorConfig;
  }
}
