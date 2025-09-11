import { Options } from "tabulator-tables";
import { ITableCustomizer } from "../ITableCustomizer";
import { RadminTable } from "../../models/radmin-table-model";

export class CustomizeTrainingsTable implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "1b5939ce-6e7f-4e03-90b7-471d4bd7770d";

  shouldApply(config: RadminTable): boolean {
    return config.guid === this.targetGuid;
  }

  customizeConfig(config: RadminTable): RadminTable {
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
