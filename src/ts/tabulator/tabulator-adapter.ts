import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  Options,
  AjaxModule,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfig } from "./tabulator-models";
import { TabulatorConfigService } from "./tabulator-config-service";
import { TabulatorDataProvider } from "./tabulator-data-provider";
import { DataViewTableConfig } from "../models/table-model";
import { TabulatorFloatingUi } from "./tabulator-floating-ui";
import { TabulatorSearchFilter } from "../../custom/search-filter";

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
    data: object[]
  ): Promise<TabulatorConfig> {
    const configService = new TabulatorConfigService();
    return configService.createTabulatorConfig(tableConfigData, data);
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
    dataProvider: TabulatorDataProvider,
    filterName?: string
  ) {
    try {
      // Get initial data for column setup
      const initialData = await dataProvider.getInitialData();

      // Base config generation
      const tabulatorConfig: Partial<ExtendedOptions> =
        await this.createTabulatorConfig(tableConfigData, initialData);

      // Build final Tabulator options
      const tabulatorOptions: ExtendedOptions = {
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: {
          method: "GET",
          headers: dataProvider.getHeaders(),
        },
        ajaxResponse: (url, params, response) => {
          console.log("Raw AJAX response:", response);
          return dataProvider.processData(response);
        },
        ...tabulatorConfig,
        dependencies: {
          DateTime: DateTime,
        },
      };

      // Create the table
      const table = new Tabulator(`#${tableName}`, tabulatorOptions);

      // Optional filtering setup
      if (filterName && tableConfigData.search) {
        this.setupFilterInput(table, filterName);
      }

      // Optional view config mode
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
