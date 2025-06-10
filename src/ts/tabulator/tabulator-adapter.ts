import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
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
  private matchAny(data: any, filterParams: any){
    //data - the data for the row being filtered
    //filterParams - params object passed to the filter

    var match = false;

    for(var key in data){
        if(data[key] == filterParams.value){
            match = true;
        }
    }

    return match;
}

  // (V1) Create a Tabulator table with provided data
  async createTableOnPromise(
    tableName: string,
    tableConfigData: DataViewTableConfig,
    entries: object[],
  ) {
    try {
      const options = await this.createCommonConfig(tableConfigData, entries);
      const table = new Tabulator(`#${tableName}`, options);

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
            table.setFilter(this.matchAny, {value:5})
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

      // Trigger update when table is built.
      table.on("tableBuilt", () => {
        table.setData(initialData);
        table.setFilter(this.matchAny, {value:5})
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
