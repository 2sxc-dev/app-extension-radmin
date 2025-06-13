import { DateTime } from "luxon";
import { TabulatorColumnConfig } from "./tabulator-models";
import { formatConfigs } from "./tabulator-column-formats";
import { DataViewColumnConfig } from "../models/table-columns-model";
import { CellComponent } from "tabulator-tables";

export class TabulatorColumnAdapter {
  convert(
    columnConfig: DataViewColumnConfig[],
    columnsAutoShowRemaining: boolean,
    entries: object[]
  ): TabulatorColumnConfig[] {
    let configuredColumns = columnConfig.map((col) => {
      let chosenFormat = col.valueFormat;

      // If the format is "" for automatic, try to discover the correct format
      if (col.valueFormat === "")
        chosenFormat = this.detectType(col.valueSelector, entries);

      const formatConfig =
        chosenFormat && formatConfigs[chosenFormat]
          ? { ...formatConfigs[chosenFormat] }
          : {};

      const column: TabulatorColumnConfig = {
        title: col.title,
        field: col.valueSelector,
        tooltip: col.tooltipEnabled
          ? col.tooltipSelector
            ? (e: Event, cell: CellComponent) =>
                this.replaceParameters(col.tooltipSelector, cell.getData())
            : true
          : false,
        width: col.width !== "automatic" ? col.width : undefined,
        ...formatConfig,
        hozAlign:
          col.horizontalAlignment !== "automatic"
            ? col.horizontalAlignment
            : undefined,
        headerHozAlign:
          col.horizontalAlignment !== "automatic"
            ? col.horizontalAlignment
            : undefined,
      };

      /**
       * Adds link formatter when linkEnable is true in the column config
       */
      if (col.linkEnable) {
        column.formatter = "link";
        column.formatterParams = {
          url: (cell: CellComponent) => {
            const params = this.replaceParameters(
              col.linkParameters,
              cell.getData()
            );
            return `?viewid=${col.linkViewId}${params ? "&" + params : ""}`;
          },
          target: "_self",
        };
      }
      return column;
    });

    if (columnsAutoShowRemaining) {
      if (entries.length === 0) {
        return configuredColumns;
      }

      // Get all keys from the first entry
      const allKeys = Object.keys(entries[0]);

      // Extract the keys that are already present in the configured columns
      const configuredFields = new Set(
        configuredColumns.map((col) => col.field)
      );

      // Create columns for any missing fields
      const remainingColumns = allKeys
        .filter((key) => !configuredFields.has(key))
        .map((key) => ({
          title: key,
          field: key,
        }));

      // Combine the configured columns with the remaining columns
      return configuredColumns.concat(remainingColumns);
    }

    return configuredColumns;
  }

  /**
   * Replaces parameters in strings with actual values from the data object.
   * For example, if a parameter is "id=[Id]&name=[Name]", it will replace [Id] and [Name]
   * with the corresponding values from the data object.
   */
  private replaceParameters(template: string, data: any): string {
    return template.replace(/\[([^\]]+)\]/g, (_, key) => {
      return this.getNestedValue(data, key) || "";
    });
  }

  /**
   * Gets the nested value from an object given a dot-separated key.
   * For example, "Subject.Guid" returns obj["Subject"]?.["Guid"]
   */
  private getNestedValue(obj: any, key: string): any {
    return key
      .split(".")
      .reduce((prev, curr) => (prev ? prev[curr] : undefined), obj);
  }

  /**
   * Checks the first non-null/undefined value in the given column
   * and tries to determine if it matches a known data type.
   * When this is the case, it returns the to-be-formatted type as a string.
   * If the type cannot be determined, it returns an empty string.
   */
  private detectType(field: string, entries: Object[]): string {
    // Attempt to parse JSON if `entries` is a string
    let parsedEntries: object[];

    if (Array.isArray(entries)) {
      parsedEntries = entries;
    } else {
      console.warn("Entries is not a string or an array, unable to process.");
      return "";
    }

    // Find the first non-null/undefined value
    const firstValue = parsedEntries
      .map((entry: any) => entry[field])
      .find((val) => val !== null && val !== undefined);

    if (firstValue === undefined) return "";
    if (typeof firstValue === "boolean") return "boolean";
    if (!isNaN(Number(firstValue)) && firstValue !== "") return "number";

    const dt = DateTime.fromISO(String(firstValue), { zone: "utc" });
    if (dt.isValid) {
      // If the date part is all zeros (year=1, month=1, day=1), treat as time
      if (dt.year === 1 && dt.month === 1 && dt.day === 1) {
        return "time";
      }
      // If the time part is all zeros, treat as date
      if (dt.hour === 0 && dt.minute === 0 && dt.second === 0) {
        return "date";
      }
      // Otherwise it's date-time
      return "date-time";
    }

    return "";
  }
}
