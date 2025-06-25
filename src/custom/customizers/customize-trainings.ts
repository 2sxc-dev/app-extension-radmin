import { Options } from "tabulator-tables";
import { DataViewTableConfig } from "../../ts/models/data-view-table-config";
import { ITableCustomizer } from "../ITableCustomizer";

export class CustomizeTrainingsTable implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "1b5939ce-6e7f-4e03-90b7-471d4bd7770d";

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
