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
  SortModule,
  Sorter,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfig } from "../models/tabulator-config-models";
import { TabulatorConfigService } from "./tabulator-config-service";
import { DataProvider } from "../providers/data-provider";
import { RadminTableConfig } from "../configs/radmin-table-config";
import { TabulatorFloatingUi } from "./tabulator-floating-ui/tabulator-floating-ui";
import { TabulatorSearchFilter } from "./tabulator-search-filter";
import { JsonSchema } from "../models/json-schema-model";
import { SchemaProvider } from "../providers/schema-provider";
import { CustomizeManager } from "../customizers/customize-manager";
import { SetupObjectSorter } from "../helpers/setup-object-sorter";

// Register required modules for Tabulator
Tabulator.registerModule([
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  AjaxModule,
  SortModule,
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
    tableConfigData: RadminTableConfig,
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
    tableConfigData: RadminTableConfig,
    dataProvider: DataProvider,
    schemaProvider: SchemaProvider,
    filterName: string | undefined,
    customizeManager: CustomizeManager,
    canEditConfig: boolean,
    canEditData: boolean
  ) {
    try {
      this.log("createTable called", { tableName, tableConfigData });

      const schema = await schemaProvider.getSchema(
        tableConfigData.dataContentType
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

      // Ensure our custom object sorter is registered BEFORE creating the table
      const sorter = new SetupObjectSorter();
      sorter.Sort();

      const table = new Tabulator(`#${tableName}`, tabulatorOptions);
      this.log("Tabulator instance created", table);

      // Apply initialSort after data has loaded (avoid calling setSort too early).
      try {
        // accept either shape so we are resilient: { field, dir } or { column, dir }
        const initialSortRaw = (tabulatorOptions as any).initialSort as
          | Array<{ field?: string; column?: string; dir: "asc" | "desc" }>
          | undefined;

        if (initialSortRaw && initialSortRaw.length) {
          // normalize into Tabulator Sorter[] (must include 'column')
          const initialSort = initialSortRaw.map((s) => ({
            column: s.column ?? s.field ?? "",
            dir: s.dir,
          })) as Sorter[];

          this.log("initialSort provided (for Tabulator)", initialSort);

          // apply only after dataLoaded to avoid early pipelines errors
          table.on("dataLoaded", () => {
            this.log("dataLoaded event — applying initialSort", initialSort);
            try {
              table.setSort(initialSort);
            } catch (err) {
              this.log("setSort on dataLoaded failed:", err);
            }
          });
        }
      } catch (err) {
        this.log("error scheduling initialSort application:", err);
      }

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

  private setupViewConfigMode(table: Tabulator, tableConfigData: RadminTableConfig) {
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

  private setupRowAddMode(table: Tabulator, tableConfigData: RadminTableConfig) {
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
