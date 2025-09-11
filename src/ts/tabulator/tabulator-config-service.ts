import { RadminTable } from "../models/radmin-table-model";
import { JsonSchema } from "../models/json-schema-model";
import { TabulatorColumnAdapter } from "./tabulator-column-adapter";
import { TabulatorConfig } from "../models/tabulator-config-models";
import { ColumnSortParser } from "../helpers/column-sort-parser";

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

    const columns = columnAdapter.convert(
      data.columnConfigs,
      data.columnsAutoShowRemaining,
      schema
    );

    const columnParser = new ColumnSortParser();
    const parsedInitialSort = columnParser.parse(
      data.columnSort,
      columns,
      schema
    );

    return {
      layout: "fitDataFill",
      columns,
      title: data.title || "2sxc Table",
      dataContentType: "",
      dataQuery: "",
      viewId: data.viewId,
      id: data.id,
      columnConfigs: data.columnConfigs,
      searchEnabled: data.searchEnabled,
      initialSort: parsedInitialSort.length ? parsedInitialSort : undefined,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: "",
    } as TabulatorConfig;
  }
}
