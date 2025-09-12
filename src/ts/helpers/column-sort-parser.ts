import { JsonSchema } from "../models/json-schema-model";
import { TabulatorSort } from "../models/tabulator-config-models";

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
 * This implementation replaces the regex-based tokenization with a small
 * deterministic CSV tokenizer that correctly handles quoted tokens and commas
 * inside quotes. It also normalizes and resolves tokens the same way as before.
 */
export class ColumnSortParser {
  debug = true;

  private log(...args: any[]) {
    if (this.debug) console.log("[ColumnSortParser]", ...args);
  }

  parse(
    sortString?: string,
    columns?: ColumnDef[],
    schema?: JsonSchema
  ): TabulatorSort[] {
    if (!sortString) {
      this.log("parse called with empty sortString");
      return [];
    }

    this.log("parse called with sortString:", sortString);

    const normalize = (s = "") => s.replace(/^["']|["']$/g, "").trim();

    // Robust CSV tokenization that respects single/double quotes
    const tokenize = (input: string): string[] => {
      const tokens: string[] = [];
      let buf = "";
      let inQuote = false;
      let quoteChar = "";
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (!inQuote && (ch === '"' || ch === "'")) {
          inQuote = true;
          quoteChar = ch;
          buf += ch;
          continue;
        }
        if (inQuote) {
          buf += ch;
          if (ch === quoteChar) {
            // check for escaped quote ("" or '') - simple handling: if next char is same quote, treat as escaped and include it
            if (input[i + 1] === quoteChar) {
              // include and skip next
              buf += input[i + 1];
              i++;
              continue;
            }
            inQuote = false;
            quoteChar = "";
          }
          continue;
        }
        if (!inQuote && ch === ",") {
          const t = buf.trim();
          if (t) tokens.push(t);
          buf = "";
          continue;
        }
        buf += ch;
      }
      const last = buf.trim();
      if (last) tokens.push(last);
      return tokens;
    };

    const tokens = tokenize(sortString);
    this.log("tokenize -> tokens:", tokens);

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

    this.log(
      "column maps sizes",
      { colFieldByLower: colFieldByLower.size },
      { colTitleByLower: colTitleByLower.size },
      { colTitleByNormalized: colTitleByNormalized.size }
    );

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

    this.log(
      "schema maps sizes",
      { schemaKeyByLower: schemaKeyByLower.size },
      { schemaTitleByLower: schemaTitleByLower.size },
      { schemaTitleByNormalized: schemaTitleByNormalized.size }
    );

    const resolveToField = (rawName: string): string => {
      const cleaned = normalize(rawName);
      const lower = cleaned.toLowerCase();
      const normalized = lower.replace(/\s+/g, "");

      this.log("resolveToField called for:", {
        rawName,
        cleaned,
        lower,
        normalized,
      });

      // configured column.field (case-insensitive)
      if (colFieldByLower.has(lower)) {
        const v = colFieldByLower.get(lower)!;
        this.log("Resolved by column.field ->", v);
        return v;
      }

      // configured column.title (case-insensitive)
      if (colTitleByLower.has(lower)) {
        const v = colTitleByLower.get(lower)!;
        this.log("Resolved by column.title (lower) ->", v);
        return v;
      }
      if (colTitleByNormalized.has(normalized)) {
        const v = colTitleByNormalized.get(normalized)!;
        this.log("Resolved by column.title (normalized) ->", v);
        return v;
      }

      // schema property key (case-insensitive)
      if (schemaKeyByLower.has(lower)) {
        const v = schemaKeyByLower.get(lower)!;
        this.log("Resolved by schema key ->", v);
        return v;
      }

      // schema property title (case-insensitive / normalized)
      if (schemaTitleByLower.has(lower)) {
        const v = schemaTitleByLower.get(lower)!;
        this.log("Resolved by schema title (lower) ->", v);
        return v;
      }
      if (schemaTitleByNormalized.has(normalized)) {
        const v = schemaTitleByNormalized.get(normalized)!;
        this.log("Resolved by schema title (normalized) ->", v);
        return v;
      }

      // fallback to cleaned token (Tabulator will attempt to match)
      this.log(
        "No resolution found, falling back to cleaned token ->",
        cleaned
      );
      return cleaned;
    };

    const result: TabulatorSort[] = tokens.map((segment, index) => {
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

      this.log("token -> parsed", {
        index,
        rawSegment: segment,
        token,
        nameToken,
        dirToken,
        dir,
        resolvedColumn: column,
      });

      return { column, dir } as TabulatorSort;
    });

    this.log("Final parsed sort array:", result);
    return result;
  }
}
