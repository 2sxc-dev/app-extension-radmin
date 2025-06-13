import { Options } from "tabulator-tables";
import { DataViewTableConfig } from "../ts/models/data-view-table-config";

export class CustomizeSkillsAndGrowth {
  customizeConfig(config: DataViewTableConfig): DataViewTableConfig {
    console.log("GUID:", config.guid);
    if (config.guid == "96d0d969-dd03-45fe-ab58-351c9ff91236") {
      console.log("<TRUE>");
    }

    return config;
  }

  customizeTabulator(options: Options): Options {
    console.log("Customizing Tabulator options for Skills and Growth");

    // Modify column formatters
    if (options.columns) {
      options.columns.forEach((column) => {
        // Customize progress formatter
        if (column.formatter === "progress") {
          column.formatterParams = {
            ...(column.formatterParams || {}),
            max: 9,
          };

          console.log(
            `Modified progress formatter for column: ${
              column.title || column.field
            }`
          );
        }

        // Customize date formatter
        if (column.formatter === "datetime") {
          const params = column.formatterParams || {};

          column.formatterParams = {
            ...params,
            outputFormat: "yyyy-MM",
          };

          console.log(
            `Modified date formatter for column: ${
              column.title || column.field
            }`
          );
        }
      });
    }

    return options;
  }
}
