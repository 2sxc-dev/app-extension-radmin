import { Options } from "tabulator-tables";
import { ITableCustomizer } from "../ITableCustomizer";
import { SxcCockpitTableConfig } from "../../models/table-config";

export class CustomizeRolesTable implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "5bca1415-291a-427a-a1c5-ebd8c7dc0c4a";

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
