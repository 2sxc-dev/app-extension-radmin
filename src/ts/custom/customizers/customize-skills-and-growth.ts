import { Options } from "tabulator-tables";
import { ITableCustomizer } from "../ITableCustomizer";
import { SxcCockpitTableConfig } from "../../models/table-config";

export class CustomizeSkillsAndGrowth implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "96d0d969-dd03-45fe-ab58-351c9ff91236";

  shouldApply(config: SxcCockpitTableConfig): boolean {
    return config.guid === this.targetGuid;
  }

  customizeConfig(config: SxcCockpitTableConfig): SxcCockpitTableConfig {
    return config;
  }

  customizeTabulator(options: Options): Options {
    // Modify column formatters
    if (options.columns) {
      options.columns.forEach((column) => {
        // Customize progress formatter
        if (column.formatter === "progress") {
          column.formatterParams = {
            ...column.formatterParams,
            max: 9,
          };
        }
        
        if (column.title === "St%") {
          column.formatter = (cell) => {
            const value = cell.getValue();
            return value !== null && value !== undefined ? `${value}%` : "";
          };
        }

        // Customize date formatter
        if (column.formatter === "datetime") {
          column.formatterParams = {
            ...column.formatterParams,
            outputFormat: "yyyy-MM",
          };
        }
      });
    }

    // Make table fit data width
    options.layout = "fitColumns";

    return options;
  }
}
