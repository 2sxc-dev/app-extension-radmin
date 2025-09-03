import { DateTime } from "luxon";
import { TabulatorColumnConfig } from "./tabulator-models";
import { formatConfigs } from "./tabulator-column-formats";
import { DataViewColumnConfig } from "../models/data-view-column-config";
import { CellComponent } from "tabulator-tables";
import { JsonSchema, SchemaProperty } from "../models/json-schema";

export class TabulatorColumnAdapter {
  convert(
    columnConfig: DataViewColumnConfig[],
    columnsAutoShowRemaining: boolean,
    schema: JsonSchema
  ): TabulatorColumnConfig[] {
    let configuredColumns = columnConfig.map((col) => {
      let chosenFormat = col.valueFormat;

      // If the format is "" for automatic, try to get format from schema
      if (col.valueFormat === "") {
        chosenFormat = this.getFormatFromSchema(col.valueSelector, schema);
      }

      const formatConfig =
        chosenFormat && formatConfigs[chosenFormat]
          ? { ...formatConfigs[chosenFormat] }
          : {};

      // Fix field name to match processed data
      const normalizedField = normalizeFieldName(col.valueSelector, schema);

      const column: TabulatorColumnConfig = {
        title: col.title,
        field: normalizedField,
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
      // Extract the keys that are already present in the configured columns
      const configuredFields = new Set(
        configuredColumns.map((col) => col.field)
      );

      // Get all properties from schema
      const schemaProperties = Object.keys(schema.properties);

      // Create columns for any missing fields
      const remainingColumns = schemaProperties
        .filter((key) => !configuredFields.has(key))
        .map((key) => {
          const property = schema.properties[key];
          const format = this.mapSchemaTypeToFormat(property);

          return {
            title: property.title || key,
            field: key,
            ...(formatConfigs[format] || {}),
          };
        });

      // Combine the configured columns with the remaining columns
      return configuredColumns.concat(remainingColumns);
    }

    return configuredColumns;
  }

  /**
   * Maps schema property types and formats to Tabulator formats
   */
  private mapSchemaTypeToFormat(property: SchemaProperty): string {
    // Format ist different from type
    if (property.format === "date-time") return "date-time";
    if (property.format === "date") return "date";
    if (property.format === "uri" || property.format === "email") return "link";

    return property.type;
  }

  /**
   * Gets format information from the schema for a specific field
   */
  private getFormatFromSchema(field: string, schema: JsonSchema): string {
    // Check if the field exists in the schema
    const normalizedField = normalizeFieldName(field, schema);
    if (schema.properties[normalizedField]) {
      const property = schema.properties[normalizedField];
      return this.mapSchemaTypeToFormat(property);
    }
    return "";
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
}

/**
 * Normalizes a field name to match schema property keys.
 * Tries exact, lowercase-first, and case-insensitive matches.
 */
function normalizeFieldName(field: string, schema: JsonSchema): string {
  const keys = Object.keys(schema.properties);
  return keys.find((k) => k.toLowerCase() === field.toLowerCase()) || field;
}
