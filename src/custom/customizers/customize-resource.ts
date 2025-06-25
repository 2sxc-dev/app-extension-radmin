import { Options } from "tabulator-tables";
import { DataViewTableConfig } from "../../ts/models/data-view-table-config";
import { ITableCustomizer } from "../ITableCustomizer";

export class CustomizeResourceTable implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "8c1ef514-0699-43b1-96c8-86a643458c18";

  shouldApply(config: DataViewTableConfig): boolean {
    return config.guid === this.targetGuid;
  }

  customizeConfig(config: DataViewTableConfig): DataViewTableConfig {
    return config;
  }

  customizeTabulator(options: Options): Options {
    // Modify column formatters
    if (options.columns) {
      options.columns.forEach((column) => {});
    }

    return options;
  }
}