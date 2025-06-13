import { Options } from "tabulator-tables";
import { DataViewTableConfig } from "../ts/models/data-view-table-config";

export class CustomizeSkillsAndGrowth {
  // Store the targeted GUID
  private readonly targetGuid = "96d0d969-dd03-45fe-ab58-351c9ff91236";

  // Track if the current table should be customized
  private shouldCustomize = false;

  customizeConfig(config: DataViewTableConfig): DataViewTableConfig {
    // Check if this table matches our target and store the result
    this.shouldCustomize = config.guid === this.targetGuid;

    if (this.shouldCustomize) {
      // You could also customize the config object here if needed
      // For example: config.title = "Custom Title";
    }

    return config;
  }

  customizeTabulator(options: Options): Options {
    // Only apply customizations if this is our target table
    if (!this.shouldCustomize) {
      return options;
    }

    // Modify column formatters
    if (options.columns) {
      options.columns.forEach((column) => {
        // Customize progress formatter
        if (column.formatter === "progress") {
          column.formatterParams = {
            ...(column.formatterParams || {}),
            max: 9,
          };
        }

        // Customize date formatter
        if (column.formatter === "datetime") {
          const params = column.formatterParams || {};

          column.formatterParams = {
            ...params,
            outputFormat: "yyyy-MM",
          };
        }
      });
    }

    return options;
  }
}
