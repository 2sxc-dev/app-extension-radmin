import { SxcCockpitTableConfig } from "../models/table-config";
import { JsonSchema } from "../models/json-schema";
import { TabulatorColumnAdapter } from "./tabulator-column-adapter";
import { TabulatorConfig } from "./tabulator-models";

/**
 * Service for creating a Tabulator configuration from SxcCockpitTableConfig.
 * Is used to convert the configuration from 2sxc into a format that Tabulator can understand.
 */
export class TabulatorConfigService {
  createTabulatorConfig(
    data: SxcCockpitTableConfig,
    schema: JsonSchema
  ): TabulatorConfig {
    const columnAdapter = new TabulatorColumnAdapter();

    return {
      layout: "fitDataFill",
      columns: columnAdapter.convert(
        data.columnConfigs,
        data.columnsAutoShowRemaining,
        schema
      ),
      title: data.title || "2sxc Table",
      dataContentType: "",
      dataQuery: "",
      viewId: data.viewId,
      id: data.id,
      columnConfigs: data.columnConfigs,
      search: data.search,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: "",
    } as TabulatorConfig;
  }
}
