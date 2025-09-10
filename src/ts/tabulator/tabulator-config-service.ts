import { RadminTable } from "../models/radmin-table";
import { JsonSchema } from "../models/json-schema";
import { TabulatorColumnAdapter } from "./tabulator-column-adapter";
import { TabulatorConfig, TabulatorSort } from "./tabulator-models";

/**
 * Service for creating a Tabulator configuration from RadminTable.
 * Is used to convert the configuration from 2sxc into a format that Tabulator can understand.
 */
export class TabulatorConfigService {
  createTabulatorConfig(
    data: RadminTable,
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
      initialSort: [{ column: "Title", dir: "asc" }], // data.columnSort,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: "",
    } as TabulatorConfig;
  }
}
