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
import { RadminTable } from "../models/radmin-table";
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

  debug = false;

  private log(...args: any[]) {
    if (this.debug) console.log("[Adapter]", ...args);
  }

  private async createTabulatorConfig(
    tableConfigData: RadminTable,
    schema: JsonSchema
  ): Promise<TabulatorConfig> {
    return this.configService.createTabulatorConfig(tableConfigData, schema);
  }

  private setupFilterInput(table: Tabulator, filterName: string) {
    const searchFilter = new TabulatorSearchFilter();
    const filterInput = searchFilter.getFilterFunction(filterName);
    if (!filterInput) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") e.preventDefault();
    };
    const onInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      table.setFilter(searchFilter.matchAny, { value });
    };

    filterInput.addEventListener("keydown", onKeyDown);
    filterInput.addEventListener("input", onInput);
    this.log("Filter input wired", filterName);
  }

  async createTable(
    tableName: string,
    tableConfigData: RadminTable,
    dataProvider: DataProvider,
    schemaProvider: SchemaProvider,
    filterName: string | undefined,
    customizeManager: CustomizeManager,
    canEditConfig: boolean,
    canEditData: boolean,
  ) {
    try {
      this.log("createTable called", { tableName, tableConfigData });

      const schema = await schemaProvider.getSchema(
        tableConfigData.dataContentType || tableConfigData.dataQuery
      );
      this.log("schema loaded", schema);

      const tabulatorConfig: Partial<ExtendedOptions> =
        await this.createTabulatorConfig(tableConfigData, schema);
      this.log("tabulatorConfig created", tabulatorConfig);

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
      this.log("tabulatorOptionsRaw", tabulatorOptionsRaw);

      const tabulatorOptions = customizeManager.customizeTabulator(
        tabulatorOptionsRaw,
        tableConfigData.guid
      );
      this.log("tabulatorOptions after customization", tabulatorOptions);

      const table = new Tabulator(`#${tableName}`, tabulatorOptions);
      this.log("Tabulator instance created", table);

      if (filterName && tableConfigData.searchEnabled) {
        this.log("setting up filter input", filterName);
        this.setupFilterInput(table, filterName);
      }

      if (this.isViewConfigMode() && canEditConfig) {
        this.log("in ViewConfigMode, setting up header handlers");
        this.setupViewConfigMode(table, tableConfigData);
      } else if (canEditData) {
        const editEnabled = !!tableConfigData.enableEdit;
        const canDelete = !!tableConfigData.enableDelete;
        this.log("row actions", { editEnabled, canDelete });
        if (editEnabled || canDelete) {
          this.setupRowActionsHover(table, editEnabled, canDelete);
        }
        if (tableConfigData.enableAdd) {
          this.log("enabling row add mode");
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
    tableConfigData: RadminTable
  ) {
    this.log("setupViewConfigMode called");
    table.on("dataLoaded", () => {
      this.log("dataLoaded → attaching headerMouseEnter");
      table.on(
        "headerMouseEnter" as any,
        (e: MouseEvent, column: ColumnComponent) => {
          this.log("headerMouseEnter triggered", column);
          this.floatingUi.showFloatingColumnMenu(column, e, tableConfigData);
        }
      );
    });
  }

  private setupRowActionsHover(
    table: Tabulator,
    enableEdit: boolean,
    enableDelete: boolean
  ) {
    this.log("setupRowActionsHover called", { enableEdit, enableDelete });

    try {
      table.off?.("rowMouseEnter");
    } catch (err) {
      console.error("Failed to unbind rowMouseEnter", err);
    }

    table.on("rowMouseEnter", (e, row: RowComponent) => {
      this.log("rowMouseEnter triggered", row.getData());
      if (enableEdit && enableDelete) {
        this.floatingUi.showFloatingMenuEditDelete(table, row, e);
      } else if (enableEdit) {
        this.floatingUi.showFloatingMenuEditOnly(table, row, e);
      } else if (enableDelete) {
        this.floatingUi.showFloatingMenuDeleteOnly(table, row, e);
      }
    });

    table.on("rowMouseLeave", (e, row: RowComponent) => {
      this.log("rowMouseLeave triggered", row.getData());
    });
  }

  private setupRowAddMode(
    table: Tabulator,
    tableConfigData: RadminTable
  ) {
    this.log("setupRowAddMode called");
    table.on("dataLoaded", () => {
      this.log("dataLoaded → showing add button");
      this.floatingUi.showAddButton(table, tableConfigData);
    });
    try {
      this.log("trying to show add button immediately");
      this.floatingUi.showAddButton(table, tableConfigData);
    } catch (err) {
      this.log("immediate add button failed", err);
    }
  }
}
