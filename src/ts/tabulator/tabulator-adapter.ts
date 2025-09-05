import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  Options,
  AjaxModule,
  ColumnComponent,
  RowComponent,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfig } from "./tabulator-models";
import { TabulatorConfigService } from "./tabulator-config-service";
import { DataProvider } from "../providers/data-provider";
import { DataViewTableConfig } from "../models/data-view-table-config";
import { TabulatorFloatingUi } from "./tabulator-floating-ui";
import { TabulatorSearchFilter } from "./tabulator-search-filter";
import { JsonSchema } from "../models/json-schema";
import { SchemaProvider } from "../providers/schema-provider";
import { CustomizeManager } from "../custom/customize-manager";

// Register required modules for Tabulator
Tabulator.registerModule([
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  AjaxModule,
]);

// Define an extended options interface to include custom properties
interface ExtendedOptions extends Options {
  dependencies?: { DateTime: typeof DateTime };
}

export class TabulatorAdapter {
  private floatingUi = new TabulatorFloatingUi();
  private configService = new TabulatorConfigService();

  private async createTabulatorConfig(
    tableConfigData: DataViewTableConfig,
    schema: JsonSchema
  ): Promise<TabulatorConfig> {
    return this.configService.createTabulatorConfig(tableConfigData, schema);
  }

  private setupFilterInput(table: Tabulator, filterName: string) {
    const searchFilter = new TabulatorSearchFilter();
    const filterInput = searchFilter.getFilterFunction(filterName);
    if (!filterInput) return;

    // Prevent Enter reload and wire local filter
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    };
    const onInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      table.setFilter(searchFilter.matchAny, { value });
    };

    filterInput.addEventListener("keydown", onKeyDown);
    filterInput.addEventListener("input", onInput);
  }

  async createTable(
    tableName: string,
    tableConfigData: DataViewTableConfig,
    dataProvider: DataProvider,
    schemaProvider: SchemaProvider,
    filterName: string | undefined,
    customizeManager: CustomizeManager
  ) {
    try {
      const schema = await schemaProvider.getSchema(
        tableConfigData.dataContentType || tableConfigData.dataQuery
      );
      const tabulatorConfig: Partial<ExtendedOptions> =
        await this.createTabulatorConfig(tableConfigData, schema);

      const tabulatorOptionsRaw: ExtendedOptions = {
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: {
          method: "GET",
          headers: dataProvider.getHeaders(),
        },
        ajaxResponse: (_url, _params, response) =>
          dataProvider.processData(response),
        ...tabulatorConfig,
        dependencies: { DateTime },
      };

      const tabulatorOptions = customizeManager.customizeTabulator(
        tabulatorOptionsRaw,
        tableConfigData.guid
      );

      const table = new Tabulator(`#${tableName}`, tabulatorOptions);

      if (filterName && tableConfigData.search) {
        this.setupFilterInput(table, filterName);
      }

      if (this.isViewConfigMode()) {
        this.setupViewConfigMode(table, tableConfigData);
      } else {
        const canEdit = !!tableConfigData.enableEdit;
        const canDelete = !!tableConfigData.enableDelete;
        if (canEdit || canDelete) {
          this.setupRowActionsHover(table, canEdit, canDelete);
        }
        if (tableConfigData.enableAdd) {
          this.setupRowAddMode(table, tableConfigData);
        }
      }

      return table;
    } catch (err) {
      console.error("Failed to create Tabulator table:", err);
      return null;
    }
  }

  isViewConfigMode(): boolean {
    const url = window.location.href.toLowerCase();
    const qp = new URLSearchParams(window.location.search)
      .get("viewconfigmode")
      ?.toLowerCase();
    return qp === "true" || url.includes("viewconfigmode/true");
  }

  private setupViewConfigMode(
    table: Tabulator,
    tableConfigData: DataViewTableConfig
  ) {
    // only bind once data is present
    table.on("dataLoaded", () => {
      table.on(
        "headerMouseEnter" as any,
        (e: MouseEvent, column: ColumnComponent) =>
          this.floatingUi.showFloatingColumnMenu(column, e, tableConfigData)
      );
    });
  }

  private setupRowActionsHover(
    table: Tabulator,
    enableEdit: boolean,
    enableDelete: boolean
  ) {
    // remove previous handler if present (defensive)
    try {
      table.off?.("rowMouseEnter");
    } catch {
      /* ignore */
    }

    table.on("rowMouseEnter", (e, row: RowComponent) => {
      if (enableEdit && enableDelete) {
        this.floatingUi.showFloatingMenuEditDelete(table, row, e);
      } else if (enableEdit) {
        this.floatingUi.showFloatingMenuEditOnly(table, row, e);
      } else if (enableDelete) {
        this.floatingUi.showFloatingMenuDeleteOnly(table, row, e);
      }
    });
  }

  private setupRowAddMode(
    table: Tabulator,
    tableConfigData: DataViewTableConfig
  ) {
    table.on("dataLoaded", () =>
      this.floatingUi.showAddButton(table, tableConfigData)
    );
    // try to show immediately if data already present; ignore failures
    try {
      this.floatingUi.showAddButton(table, tableConfigData);
    } catch (err) {
      console.log(err);
    }
  }
}
