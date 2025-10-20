import { Options } from "tabulator-tables";
import { ITableCustomizer } from "../ITableCustomizer";
import { RadminTable } from "../../models/radmin-table-model";

export class CustomizeAccessCodesTable implements ITableCustomizer {
  // Store the targeted GUID
  private readonly targetGuid = "fd65bdbb-cc93-4b01-976e-4bc906eb8d9a";

  shouldApply(config: RadminTable): boolean {
    console.log(
      "Checking table:",
      config.title,
      config.dataContentType,
      config.guid
    );
    // return config.guid === this.targetGuid;
    return true;
  }

  customizeConfig(config: RadminTable): RadminTable {
    return config;
  }

  customizeTabulator(options: Options): Options {
    // Modify column formatters
    if (options.columns) {
      const urlCol = options.columns.find(
        (c) => c.title?.toLowerCase() === "url"
      );
      if (urlCol) {
        urlCol.formatter = (cell) => {
          const row = cell.getRow().getData() || {};
          const code = String(row.code ?? "");

          /*
            Build a link:
            - If `code` already includes an http/https scheme, use it unchanged.
            - Otherwise, if it starts with "/", treat it as a path.
            - Otherwise, treat it as a query string `?accesscode=...`.
            - If the result is not absolute (no scheme), prefix it with window.location.origin.
          */
          if (!code) return "";
          const hasScheme = /^https?:\/\//i.test(code);
          const path = hasScheme
            ? code
            : code.startsWith("/")
            ? code
            : `?accesscode=${code}`;
          const url = /^https?:\/\//i.test(path)
            ? path
            : `${window.location.origin}${path}`;

          return `<a href="${url}">${url}</a>`;
        };
      }
    }

    // Make table fit data width
    options.layout = "fitColumns";

    return options;
  }
}
