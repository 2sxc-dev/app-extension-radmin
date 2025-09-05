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
  dependencies?: {
    DateTime: typeof DateTime;
  };
}

export class TabulatorAdapter {
  private floatingUi = new TabulatorFloatingUi();
  /**
   * Create a common configuration base from 2sxc configuration
   */
  private async createTabulatorConfig(
    tableConfigData: DataViewTableConfig,
    schema: JsonSchema
  ): Promise<TabulatorConfig> {
    const configService = new TabulatorConfigService();

    return configService.createTabulatorConfig(tableConfigData, schema);
  }

  /**
   * Set up a purely custom input filter for the table
   */
  private setupFilterInput(table: Tabulator, filterName: string) {
    const searchFilter = new TabulatorSearchFilter();

    const filterInput = searchFilter.getFilterFunction(filterName);
    if (!filterInput) return;

    // Prevent 'Enter' from reloading page
    filterInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        return false;
      }
    });

    // Apply local matchAny filter
    filterInput.addEventListener("input", (e) => {
      const value = (e.target as HTMLInputElement).value;
      table.setFilter(searchFilter.matchAny, { value });
    });
  }

  /**
   * Create a Tabulator table with AJAX data loading
   */
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

      // Build final Tabulator options
      const tabulatorOptionsRaw: ExtendedOptions = {
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: {
          method: "GET",
          headers: dataProvider.getHeaders(),
        },
        ajaxResponse: (url, params, response) => {
          return dataProvider.processData(response);
        },
        ...tabulatorConfig,
        dependencies: {
          DateTime: DateTime,
        },
      };

      // Apply customizations to the options using the manager
      const tabulatorOptions = customizeManager.customizeTabulator(
        tabulatorOptionsRaw,
        tableConfigData.guid
      );

      // Create the table
      const table = new Tabulator(`#${tableName}`, tabulatorOptions);

      // Optional filtering setup
      if (filterName && tableConfigData.search)
        this.setupFilterInput(table, filterName);

      // Optional table config mode (edit, add)
      if (this.isViewConfigMode())
        this.setupViewConfigMode(table, tableConfigData);
      else {
        // Only allow data manipulation if not in table config mode
        // Attach a single row hover listener if edit or delete is enabled
        if (tableConfigData.enableEdit || tableConfigData.enableDelete) {
          this.setupRowActionsHover(
            table,
            !!tableConfigData.enableEdit,
            !!tableConfigData.enableDelete
          );
        }

        // Optional row (data) adding setup
        if (tableConfigData.enableAdd)
          this.setupRowAddMode(table, tableConfigData);
      }

      return table;
    } catch (err) {
      console.error("Failed to create Tabulator table:", err);
      return null;
    }
  }

  /**
   * Check if the current view is in configuration mode
   */
  isViewConfigMode(): boolean {
    const url = window.location.href.toLowerCase();
    const queryParamValue = new URLSearchParams(window.location.search)
      .get("viewconfigmode")
      ?.toLowerCase();
    return queryParamValue === "true" || url.includes("viewconfigmode/true");
  }

  /**
   * Setup view configuration mode
   */
  private setupViewConfigMode(
    table: Tabulator,
    tableConfigData: DataViewTableConfig
  ): void {
    table.on("dataLoaded", () => {
      // Edit columns on header hover
      table.on(
        "headerMouseEnter" as any,
        (e: MouseEvent, column: ColumnComponent) => {
          this.floatingUi.showFloatingColumnMenu(column, e, tableConfigData);
        }
      );
    });
  }

  /**
   * Attach a single row hover handler that shows the floating action menu.
   * This is used for edit and/or delete actions, but the actual menu variant
   * is chosen here so we don't pass flags into the floating UI or mutate datasets.
   */
  private setupRowActionsHover(
    table: Tabulator,
    enableEdit: boolean,
    enableDelete: boolean
  ): void {
    // Remove any existing to avoid duplicate handlers when re-initializing
    try {
      table.off && table.off("rowMouseEnter");
    } catch {
      // ignore if off isn't supported
    }

    table.on("rowMouseEnter", (e, row: RowComponent) => {
      // Choose which floating UI variant to show based on adapter-side flags.
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
    // Show the add button after data is loaded (and on subsequent loads)
    table.on("dataLoaded", () => {
      this.floatingUi.showAddButton(table, tableConfigData);
    });

    // Also try to show it right away in case data was already loaded
    // (Tabulator will usually fire dataLoaded, but this is a safe-guard)
    try {
      // If Tabulator has data already, call it once
      this.floatingUi.showAddButton(table, tableConfigData);
    } catch {
      // ignore
    }
  }
}
