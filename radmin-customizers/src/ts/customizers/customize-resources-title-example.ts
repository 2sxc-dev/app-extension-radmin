import { Options } from "tabulator-tables";
import { TableCustomizer } from "../../../../extensions/radmin/src/customizers/table-customizer";
import { RadminTableConfig } from "../../../../extensions/radmin/src/configs/radmin-table-config";

export class CustomizeAccessCodesTable implements TableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "ccfefa24-f139-4d27-813b-1e3e3dcc570e";

  shouldApply(config: RadminTableConfig): boolean {
    console.log(
      "Checking table:",
      config.title,
      config.dataContentType,
      config.guid
    );
    return config.guid === this.targetGuid;
  }

  customizeConfig(config: RadminTableConfig): RadminTableConfig {
    return config;
  }

  customizeTabulator(options: Options): Options {
    // Modify column formatters
    if (options.columns) {
      const titleCol = options.columns.find(
        (c) => c.title?.toLowerCase() === "title"
      );
      if (titleCol) {
        titleCol.formatter = (cell) => {
          const value = cell.getValue();
          return `<span style="color:red">${value ?? ""}</span>`;
        };
      }
    }

    // Make table fit data width
    options.layout = "fitColumns";

    return options;
  }
}
