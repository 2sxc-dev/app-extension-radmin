import { JsonSchema } from "../models/json-schema";
import { TabulatorSort } from "../tabulator/tabulator-models";

type ColumnDef = { field?: string; title?: string };

/**
 * Parse a CSV-style column sort string into TabulatorSort[].
 *
 * Accepted inputs:
 *  - Title
 *  - Title:desc
 *  - "Full Name:desc"
 *  - 'Address:asc'
 *  - Title,Age
 *
 * Matching order (first hit wins):
 *  1. configured column.field (case-insensitive)
 *  2. configured column.title (case-insensitive / normalized)
 *  3. schema property key (case-insensitive)
 *  4. schema property.title (case-insensitive / normalized)
 *  5. fallback to the cleaned token itself
 */
export class ColumnSortParser {
  parse(
    sortString?: string,
    columns?: ColumnDef[],
    schema?: JsonSchema
  ): TabulatorSort[] {
    if (!sortString) return [];

    const normalize = (s = "") => s.replace(/^["']|["']$/g, "").trim();
    const normalizeKey = (s = "") =>
      normalize(s).toLowerCase().replace(/\s+/g, "");

    // Tokenize CSV while respecting quoted tokens
    const tokens =
      sortString
        .match(/(?:[^,"']+|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')+/g)
        ?.map((t) => t.trim())
        .filter(Boolean) || [];

    // Build lookup maps to make resolveToField fast and concise
    const colFieldByLower = new Map<string, string>();
    const colTitleByLower = new Map<string, string>();
    const colTitleByNormalized = new Map<string, string>();

    (columns || []).forEach((c) => {
      if (c.field) colFieldByLower.set(c.field.toLowerCase(), c.field);
      if (c.title) {
        const titleStr = c.title.toString();
        colTitleByLower.set(titleStr.toLowerCase(), c.field ?? titleStr);
        colTitleByNormalized.set(
          titleStr.toLowerCase().replace(/\s+/g, ""),
          c.field ?? titleStr
        );
      }
    });

    const schemaProps = schema?.properties || {};
    const schemaKeys = Object.keys(schemaProps);
    const schemaKeyByLower = new Map<string, string>();
    const schemaTitleByLower = new Map<string, string>();
    const schemaTitleByNormalized = new Map<string, string>();

    schemaKeys.forEach((k) => {
      schemaKeyByLower.set(k.toLowerCase(), k);
      const title = (schemaProps[k]?.title || "").toString();
      if (title) {
        schemaTitleByLower.set(title.toLowerCase(), k);
        schemaTitleByNormalized.set(title.toLowerCase().replace(/\s+/g, ""), k);
      }
    });

    const resolveToField = (rawName: string): string => {
      const cleaned = normalize(rawName);
      const lower = cleaned.toLowerCase();
      const normalized = lower.replace(/\s+/g, "");

      // configured column.field (case-insensitive)
      const byField = colFieldByLower.get(lower);
      if (byField) return byField;

      // configured column.title (case-insensitive)
      const byTitle =
        colTitleByLower.get(lower) ?? colTitleByNormalized.get(normalized);
      if (byTitle) return byTitle;

      // schema property key (case-insensitive)
      const bySchemaKey = schemaKeyByLower.get(lower);
      if (bySchemaKey) return bySchemaKey;

      // schema property title (case-insensitive / normalized)
      const bySchemaTitle =
        schemaTitleByLower.get(lower) ??
        schemaTitleByNormalized.get(normalized);
      if (bySchemaTitle) return bySchemaTitle;

      // fallback to cleaned token (Tabulator will attempt to match)
      return cleaned;
    };

    const result: TabulatorSort[] = tokens.map((segment) => {
      // remove surrounding quotes from the whole token before splitting
      const token = normalize(segment);

      // split on the first colon only
      const idx = token.indexOf(":");
      const namePart = idx === -1 ? token : token.substring(0, idx);
      const dirPart = idx === -1 ? "" : token.substring(idx + 1);

      const nameToken = normalize(namePart);
      const dirToken = normalize(dirPart || "asc").toLowerCase();
      const dir: "asc" | "desc" = dirToken === "desc" ? "desc" : "asc";

      const column = resolveToField(nameToken);

      return { column, dir } as TabulatorSort;
    });

    return result;
  }
}
