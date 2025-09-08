import { TabulatorColumnConfig } from "./tabulator-models";
import { formatConfigs } from "./tabulator-column-formats";
import { SxcCockpitColumnConfig } from "../models/column-config";
import { CellComponent } from "tabulator-tables";
import { JsonSchema, SchemaProperty } from "../models/json-schema";

export class TabulatorColumnAdapter {
  convert(
    columnConfig: SxcCockpitColumnConfig[],
    columnsAutoShowRemaining: boolean,
    schema: JsonSchema
  ): TabulatorColumnConfig[] {
    // Process configured columns
    const configuredColumns = columnConfig.map((col) => {
      const normalizedField = normalizeFieldName(col.valueSelector, schema);
      const prop = schema.properties[normalizedField];
      const chosenFormat =
        col.valueFormat || this.getFormatFromSchema(col.valueSelector, schema);
      const formatConfig = formatConfigs[chosenFormat] || {};

      // Determine formatter based on field type and configuration
      let formatter = formatConfig.formatter;
      if (
        (prop?.type === "object" || prop?.type === "array") &&
        !col.linkEnable
      ) {
        formatter = objectTitleFormatter;
      }

      const column: TabulatorColumnConfig = {
        title: col.title,
        field: normalizedField,
        formatter,
        ...formatConfig,
        // Only set alignment if explicitly specified
        hozAlign:
          col.horizontalAlignment !== "automatic"
            ? col.horizontalAlignment
            : undefined,
        headerHozAlign:
          col.horizontalAlignment !== "automatic"
            ? col.horizontalAlignment
            : undefined,
        // Only set width if explicitly specified
        width: col.width !== "automatic" ? col.width : undefined,
        // Handle tooltip configuration
        tooltip: !col.tooltipEnabled
          ? false
          : col.tooltipSelector
          ? (e: Event, cell: CellComponent) =>
              this.replaceParameters(col.tooltipSelector, cell.getData())
          : true,
      };

      // Configure link if enabled
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

    // Add remaining columns from schema if configured
    if (!columnsAutoShowRemaining) {
      return configuredColumns;
    }

    // Get fields that are already configured
    const configuredFields = new Set(configuredColumns.map((col) => col.field));

    // Create columns for remaining schema properties
    const remainingColumns = Object.keys(schema.properties)
      .filter((key) => !configuredFields.has(key))
      .map((key) => {
        const property = schema.properties[key];
        const format = this.mapSchemaTypeToFormat(property);
        const formatConfig = formatConfigs[format] || {};

        return {
          title: property.title || key,
          field: key,
          ...formatConfig,
          formatter:
            property.type === "object" || property.type === "array"
              ? objectTitleFormatter
              : formatConfig.formatter,
        };
      });

    return [...configuredColumns, ...remainingColumns];
  }

  private mapSchemaTypeToFormat(property: SchemaProperty): string {
    if (property.format === "date-time") return "date-time";
    if (property.format === "date") return "date";
    if (property.format === "uri" || property.format === "email") return "link";
    return property.type;
  }

  private getFormatFromSchema(field: string, schema: JsonSchema): string {
    const normalizedField = normalizeFieldName(field, schema);
    const property = schema.properties[normalizedField];
    return property ? this.mapSchemaTypeToFormat(property) : "";
  }

  private replaceParameters(template: string, data: any): string {
    return template.replace(
      /\[([^\]]+)\]/g,
      (_, key) => this.getNestedValue(data, key) || ""
    );
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split(".").reduce((prev, curr) => prev?.[curr], obj);
  }
}

/**
 * Formats the title for object and array fields.
 */
function objectTitleFormatter(cell: CellComponent): string {
  const value = cell.getValue();

  if (!value) return "";
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    const first = value[0];
    const title = first?.Title ?? first?.title ?? JSON.stringify(first);
    const suffix = value.length > 1 ? ` +${value.length - 1}` : "";
    return `${title}${suffix}`;
  }

  if (typeof value === "object") {
    return value.Title ?? value.title ?? JSON.stringify(value);
  }

  return String(value);
}

/**
 * Normalizes a field name to match schema property keys.
 * Tries exact, lowercase-first, and case-insensitive matches.
 */
function normalizeFieldName(field: string, schema: JsonSchema): string {
  const keys = Object.keys(schema.properties);
  return keys.find((k) => k.toLowerCase() === field.toLowerCase()) || field;
}
