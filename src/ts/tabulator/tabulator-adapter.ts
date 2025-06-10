import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
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

export class TabulatorAdapter {
  // Shared helper to create common Tabulator configuration options
  private async createCommonConfig(
    tableConfigData: DataViewTableConfig,
    data: object[]
  ): Promise<any> {
    const configService = new TabulatorConfigService();
    const config: TabulatorConfig = configService.createTabulatorConfig(
      tableConfigData,
      data
    );
    // Build the common options for the table
    return {
      ...config,
      data,
      dependencies: {
        DateTime: DateTime,
      },
    };
  }

  private floatingUi = new TabulatorFloatingUi();

  /**
   * @param data
   * @param filterParams
   * @returns
   */
  private matchAny(data: any, filterParams: any, row?: any): boolean {
    const search = filterParams.value?.toString().toLowerCase() || "";
    for (const key in data) {
      const value = data[key];
      if (value != null && value.toString().toLowerCase().includes(search)) {
        return true;
      }
    }
    return false;
  }

  private setupFilterInput(table: Tabulator, filterName: string) {
    const filterInput = document.querySelector<HTMLInputElement>(
      `#${filterName}`
    );
    if (filterInput) {
      filterInput.addEventListener("input", (e) => {
        const value = (e.target as HTMLInputElement).value;
        table.setFilter(this.matchAny, { value });
      });
    }
  }

  // (V1) Create a Tabulator table with provided data
  async createTableOnPromise(
    tableName: string,
    filterName: string,
    tableConfigData: DataViewTableConfig,
    entries: object[]
  ) {
    try {
      const options = await this.createCommonConfig(tableConfigData, entries);
      const table = new Tabulator(`#${tableName}`, options);

      this.setupFilterInput(table, filterName);

      if (this.isViewConfigMode()) {
        table.on("dataProcessing", () => {
          // Wait for data to be processed
          table.on("rowMouseEnter", (e: Event, row) => {
            // Trigger Action Buttons for rows
            this.floatingUi.showFloatingMenu(table, row, e);
          });

          table.on("headerMouseEnter", (e, column) => {
            // Trigger Action Buttons for column headers
            this.floatingUi.showFloatingColumnMenu(column, e, tableConfigData);
          });
        });
      }
    } catch (err) {
      console.error("Failed to create Tabulator table:", err);
    }
  }

  // (V2) Create a Tabulator table with AJAX data loading
  async createTable(
    tableName: string,
    tableConfigData: DataViewTableConfig,
    dataProvider: TabulatorDataProvider,
    filterName?: string,
  ) {
    try {
      const initialData: object[] = await dataProvider.getAjaxRequestFunc()();

      // Build shared configuration options.
      const options = await this.createCommonConfig(
        tableConfigData,
        initialData
      );

      // Add AJAX specific configuration.
      options.ajaxContentType = "json";

      const table = new Tabulator(`#${tableName}`, options);

      // Set up filter input if filterName is provided
      if (filterName) {
        this.setupFilterInput(table, filterName);
      }

      // Trigger update when table is built.
      table.on("tableBuilt", () => {
        table.setData(initialData);
      });

      if (this.isViewConfigMode()) {
        table.on("dataProcessing", () => {
          // Wait for data to be processed
          table.on("rowMouseEnter", (e, row) => {
            // Trigger Action Buttons for rows
            this.floatingUi.showFloatingMenu(table, row, e);
          });

          table.on("headerMouseEnter", (e, column) => {
            // Trigger Action Buttons for column headers
            this.floatingUi.showFloatingColumnMenu(column, e, tableConfigData);
          });
        });
      }
    } catch (err) {
      console.error("Failed to create Tabulator table:", err);
    }
  }

  isViewConfigMode(): boolean {
    const url = window.location.href.toLowerCase();
    const queryParamValue = new URLSearchParams(window.location.search)
      .get("viewconfigmode")
      ?.toLowerCase();

    // TODO: @2pp - Dirty hack, later use 2sxc MyPage BasisURL...
    // Hardcoded URL check for viewconfigmode
    return queryParamValue === "true" || url.includes("viewconfigmode/true");
  }
}
