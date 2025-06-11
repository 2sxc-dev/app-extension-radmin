import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  Options,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfig } from "./tabulator-models";
import { TabulatorConfigService } from "./tabulator-config-service";
import { TabulatorDataProvider } from "./tabulator-data-provider";
import { DataViewTableConfig } from "../models/table-model";
import { TabulatorFloatingUi } from "./tabulator-floating-ui";

// Register required modules for Tabulator
Tabulator.registerModule([
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
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
  private async createCommonConfig(
    tableConfigData: DataViewTableConfig,
    data: object[]
  ): Promise<TabulatorConfig> {
    const configService = new TabulatorConfigService();
    return configService.createTabulatorConfig(tableConfigData, data);
  }

  /**
   * Custom filter function that matches any field in a row against the search term
   */
  private matchAny(data: any, filterParams: any, row?: any): boolean {
    const search = filterParams.value?.toString().toLowerCase() || "";
    if (!search) return true;

    // Check row cells if row object is available
    if (row && row.getCells) {
      for (const cell of row.getCells()) {
        const value = cell.getValue();
        if (value != null && String(value).toLowerCase().includes(search)) {
          return true;
        }
      }
      return false;
    }

    // Fallback: search in the data object
    for (const key in data) {
      const value = data[key];
      if (value != null) {
        const stringValue =
          typeof value === "object" ? JSON.stringify(value) : String(value);
        if (stringValue.toLowerCase().includes(search)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Set up a purely custom input filter for the table
   */
  private setupFilterInput(table: Tabulator, filterName: string) {
    const filterInput = document.querySelector<HTMLInputElement>(
      `#${filterName}`
    );

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
      table.setFilter(this.matchAny, { value });
    });
  }

  /**
   * Create a Tabulator table with data loaded via Promise
   */
  async createTableOnPromise(
    tableName: string,
    filterName: string,
    tableConfigData: DataViewTableConfig,
    entries: object[]
  ) {
    try {
      const config = await this.createCommonConfig(tableConfigData, entries);

      // Apply pagination settings from 2sxc config
      if (tableConfigData.pagingMode === "true") {
        config.pagination = true;
        config.paginationSize = tableConfigData.pagingSize ?? 10;
      }

      // Add dependencies separately using our extended interface
      const options: ExtendedOptions = {
        ...config,
        data: entries,
        layout: config.layout || "fitDataStretch",
        dependencies: {
          DateTime: DateTime,
        },
      };

      const table = new Tabulator(`#${tableName}`, options as Options);
      this.setupFilterInput(table, filterName);

      if (this.isViewConfigMode()) {
        this.setupViewConfigMode(table, tableConfigData);
      }

      return table;
    } catch (err) {
      console.error("Failed to create Tabulator table:", err);
      return null;
    }
  }

  /**
   * Create a Tabulator table with AJAX data loading
   * Refactored to only use the local custom filter (no remote filtering).
   */
  async createTable(
    tableName: string,
    tableConfigData: DataViewTableConfig,
    dataProvider: TabulatorDataProvider,
    filterName?: string,
    additionalOptions?: Options
  ) {
    try {
      // Get sample data for column setup
      const sampleData = await dataProvider.getInitialData();
      const baseConfig = await this.createCommonConfig(
        tableConfigData,
        sampleData
      );

      // Apply pagination settings
      const paginationConfig: Partial<Options> =
        tableConfigData.pagingMode === "true"
          ? {
              pagination: true,
              paginationMode: "remote",
              paginationSize: tableConfigData.pagingSize ?? 10,
              paginationSizeSelector: [10, 25, 50, 100],
              paginationInitialPage: 1,
            }
          : {};

      const ajaxConfig = dataProvider.getAjaxConfig();

      const finalOptions: ExtendedOptions = {
        ...baseConfig,
        data: sampleData,
        ...paginationConfig,
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: ajaxConfig,
        ajaxContentType: "json",
        ajaxURLGenerator: dataProvider.getUrlGenerator(),
        ajaxResponse: dataProvider.getResponseProcessor(),
        dependencies: {
          DateTime: DateTime,
        },
        ...(additionalOptions || {}),
      };

      const table = new Tabulator(`#${tableName}`, finalOptions as Options);

      if (filterName) {
        this.setupFilterInput(table, filterName);
      }

      if (this.isViewConfigMode()) {
        this.setupViewConfigMode(table, tableConfigData);
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
      table.on("rowMouseEnter", (e, row) => {
        this.floatingUi.showFloatingMenu(table, row, e);
      });

      table.on("headerMouseEnter", (e, column) => {
        this.floatingUi.showFloatingColumnMenu(column, e, tableConfigData);
      });
    });
  }
}
