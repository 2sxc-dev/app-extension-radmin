import { Options } from "tabulator-tables";
import { ITableCustomizer } from "../ITableCustomizer";
import { RadminTable } from "../../models/radmin-table";

export class CustomizeResourceTable implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "8c1ef514-0699-43b1-96c8-86a643458c18";

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