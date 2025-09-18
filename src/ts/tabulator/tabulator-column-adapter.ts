import { TabulatorColumnConfig } from "../models/tabulator-config-models";
import { formatConfigs } from "./tabulator-column-formats";
import { RadminColumn } from "../models/radmin-column-model";
import { CellComponent } from "tabulator-tables";
import { JsonSchema, SchemaProperty } from "../models/json-schema-model";
import { GroupPropertyIdentifier } from "../helpers/group-property-identifier";
import HtmlStripper from "../helpers/html-stripper";

export class TabulatorColumnAdapter {
  debug = false;

  private log(...args: any[]) {
    if (this.debug) console.log("[Adapter]", ...args);
  }

  convert(
    columnConfig: RadminColumn[],
    columnsAutoShowRemaining: boolean,
    schema: JsonSchema
  ): TabulatorColumnConfig[] {
    this.log(
      "convert called with",
      { columnConfigLength: columnConfig.length },
      { columnsAutoShowRemaining },
      { schemaProperties: Object.keys(schema.properties).length }
    );

    // Helper to decide whether a schema property represents a "group" (should not be auto-added)
    const isGroupProperty = new GroupPropertyIdentifier().identify;

    // Process configured columns (explicit user config). If a configured column points to a group property,
    // skip it (group fields should not become visible columns).
    const configuredColumns = columnConfig
      .map((col) => {
        const normalizedField = normalizeFieldName(col.valueSelector, schema);
        const prop = schema.properties[normalizedField];
        this.log(
          "configured column:",
          { col },
          "normalizedField:",
          normalizedField,
          "schemaProp:",
          prop
        );

        if (isGroupProperty(prop, normalizedField)) {
          // skip any configured column that references a group property
          this.log(
            "Skipping configured column because it references a group property:",
            normalizedField,
            col
          );
          return null;
        }

        const chosenFormat =
          col.valueFormat ||
          this.getFormatFromSchema(col.valueSelector, schema);
        const formatConfig = formatConfigs[chosenFormat] || {};
        this.log("chosenFormat:", chosenFormat, "formatConfig:", formatConfig);

        // Determine formatter based on field type and configuration
        let formatter = formatConfig.formatter;
        let sorter = formatConfig.sorter;

        if (
          (prop?.type === "object" || prop?.type === "array") &&
          !col.linkEnable
        ) {
          this.log("Using objectTitleFormatter for", normalizedField);
          formatter = objectTitleFormatter;
          // Use the registered custom object sorter
          sorter = "object";
        }

        const column: TabulatorColumnConfig = {
          title: col.title,
          field: normalizedField,
          formatter,
          sorter,
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

        this.log(
          "Built preliminary column config for field",
          normalizedField,
          column
        );

        // Configure link if enabled
        if (col.linkEnable) {
          this.log("Link enabled for column", normalizedField, {
            linkViewId: col.linkViewId,
            linkParameters: col.linkParameters,
          });
          column.formatter = "link";
          column.formatterParams = {
            url: (cell: CellComponent) => {
              const params = this.replaceParameters(
                col.linkParameters,
                cell.getData()
              );
              const url = `?viewid=${col.linkViewId}${
                params ? "&" + params : ""
              }`;
              this.log("Generated link url for cell", {
                field: normalizedField,
                url,
              });
              return url;
            },
            target: "_self",
          };
          // When link is enabled we don't want the object formatter/sorter interfering
          // (link formatter will produce a string)
          if (prop?.type === "object" || prop?.type === "array") {
            this.log(
              "Overriding sorter to 'string' for linked object/array field",
              normalizedField
            );
            column.sorter = "string";
          }
        }

        // If schema indicates this is a WYSIWYG/html field (or format says html),
        // and the column does not already have an explicit formatter (and it's not a link),
        // inject the safe plain-text formatter that decodes and strips HTML.
        const hasExplicitFormatter = !!column.formatter;
        if (
          !col.linkEnable &&
          !hasExplicitFormatter &&
          HtmlStripper.schemaPropertyIndicatesHtml(prop)
        ) {
          this.log(
            "Injecting plainTextFormatter for column (schema indicates html):",
            col,
            normalizedField
          );
          column.formatter = HtmlStripper.plainTextFormatter;
        }

        this.log("Final column config for field", normalizedField, column);
        return column;
      })
      .filter((c): c is TabulatorColumnConfig => !!c); // remove nulls (skipped group columns)

    this.log("Configured columns built", {
      configuredCount: configuredColumns.length,
    });

    // Add remaining columns from schema if configured
    if (!columnsAutoShowRemaining) {
      this.log(
        "columnsAutoShowRemaining is false — returning configured columns only"
      );
      return configuredColumns;
    }

    // Get fields that are already configured
    const configuredFields = new Set(configuredColumns.map((col) => col.field));
    this.log("Configured fields set:", Array.from(configuredFields));

    // Create columns for remaining schema properties, skipping group properties
    const remainingColumns = Object.keys(schema.properties)
      .filter((key) => !configuredFields.has(key))
      .filter((key) => {
        const prop = schema.properties[key];
        // do not auto-add group properties
        const isGroup = isGroupProperty(prop, key);
        if (isGroup) this.log("Skipping auto-add of group property:", key);
        return !isGroup;
      })
      .map((key) => {
        const property = schema.properties[key];
        const format = this.mapSchemaTypeToFormat(property);
        const formatConfig = formatConfigs[format] || {};
        this.log("Auto-adding column for key:", key, { format, formatConfig });

        const col: TabulatorColumnConfig = {
          title: property.title || key,
          field: key,
          ...formatConfig,
          formatter:
            property.type === "object" || property.type === "array"
              ? objectTitleFormatter
              : formatConfig.formatter,
          // Use custom sorter for objects/arrays
          sorter:
            property.type === "object" || property.type === "array"
              ? "object"
              : formatConfig.sorter,
        } as TabulatorColumnConfig;

        // If schema explicitly indicates html/wysiwyg, and no explicit formatter was provided,
        // set the safe plain-text formatter (do not override objectTitleFormatter).
        if (
          !col.formatter &&
          HtmlStripper.schemaPropertyIndicatesHtml(property)
        ) {
          this.log(
            "Auto-injecting plainTextFormatter for auto-added html field:",
            key
          );
          col.formatter = HtmlStripper.plainTextFormatter;
        }

        this.log("Built auto column config for key:", key, col);
        return col;
      });

    this.log("Remaining columns built", {
      remainingCount: remainingColumns.length,
    });

    return [...configuredColumns, ...remainingColumns];
  }

  private mapSchemaTypeToFormat(property: SchemaProperty): string {
    const origType = property.type;
    if (property.format === "date-time") {
      this.log("mapSchemaTypeToFormat: using 'date-time' for", { property });
      return "date-time";
    }
    if (property.format === "date") {
      this.log("mapSchemaTypeToFormat: using 'date' for", { property });
      return "date";
    }
    if (property.format === "uri" || property.format === "email") {
      this.log("mapSchemaTypeToFormat: using 'link' for", { property });
      return "link";
    }
    this.log("mapSchemaTypeToFormat: falling back to type", origType);
    return property.type;
  }

  private getFormatFromSchema(field: string, schema: JsonSchema): string {
    const normalizedField = normalizeFieldName(field, schema);
    const property = schema.properties[normalizedField];
    const format = property ? this.mapSchemaTypeToFormat(property) : "";
    this.log("getFormatFromSchema", { field, normalizedField, format });
    return format;
  }

  private replaceParameters(template: string, data: any): string {
    try {
      const result = template.replace(
        /\[([^\]]+)\]/g,
        (_, key) => this.getNestedValue(data, key) || ""
      );
      this.log("replaceParameters", { template, result });
      return result;
    } catch (err) {
      this.log("replaceParameters error", err, { template });
      return "";
    }
  }

  private getNestedValue(obj: any, key: string): any {
    try {
      const val = key.split(".").reduce((prev, curr) => prev?.[curr], obj);
      this.log("getNestedValue", { key, val });
      return val;
    } catch (err) {
      this.log("getNestedValue error", err, { key });
      return undefined;
    }
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
  // prefer exact match first
  const exact = keys.find((k) => k === field);
  if (exact) return exact;
  // then case-insensitive match
  const ci = keys.find((k) => k.toLowerCase() === field.toLowerCase());
  return ci || field;
}