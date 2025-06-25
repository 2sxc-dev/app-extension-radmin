import { Options } from "tabulator-tables";
import { DataViewTableConfig } from "../../ts/models/data-view-table-config";
import { ITableCustomizer } from "../ITableCustomizer";

export class CustomizeRolesTable implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "5bca1415-291a-427a-a1c5-ebd8c7dc0c4a";

  shouldApply(config: DataViewTableConfig): boolean {
    return config.guid === this.targetGuid;
  }

  customizeConfig(config: DataViewTableConfig): DataViewTableConfig {
    return config;
  }

  customizeTabulator(options: Options): Options {
    // Modify column formatters
    if (options.columns) {
      options.columns.forEach((column) => {
        // Get both title and field for more reliable matching
        const title = (column.title || "").toLowerCase();
        const field = (column.field || "").toLowerCase();

        // Target columns containing "guid" in either title or field
        if (title.includes("guid") || field.includes("guid")) {
          // Add a simple formatter for GUID fields
          column.formatter = function (cell) {
            const value = cell.getValue();
            if (typeof value === "string" && value.length > 10) {
              return value.substring(0, 8) + "...";
            }
            return value;
          };
        }
      });
    }

    return options;
  }
}
